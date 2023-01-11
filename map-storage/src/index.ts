import * as grpc from "@grpc/grpc-js";
import fs from "fs";
import express from "express";
import cors from "cors";
import { mapStorageServer } from "./MapStorageServer";
import { mapsManager } from "./MapsManager";
import { MapStorageService } from "@workadventure/messages/src/ts-proto-generated/services";
import { proxyFiles } from "./FileFetcher/FileFetcher";
import { UploadController } from "./Upload/UploadController";
import { fileSystem } from "./fileSystem";
import passport from "passport";
import { passportStrategy } from "./Services/Authentication";
import { mapPath } from "./Services/PathMapper";

const server = new grpc.Server();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
server.addService(MapStorageService, mapStorageServer);

server.bindAsync(`0.0.0.0:50053`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
        throw err;
    }
    console.log("Application is running");
    console.log("gRPC port is 50053");
    server.start();
});

const app = express();
app.use(cors());

passport.use(passportStrategy);
app.use(passport.initialize());

app.get("*.json", (req, res, next) => {
    (async () => {
        const path = req.url;
        const domain = req.hostname;
        if (path.includes("..") || domain.includes("..")) {
            res.status(400).send("Invalid request");
            return;
        }
        res.send(await mapsManager.getMap(path, domain));
    })().catch((e) => next(e));
});

app.get("/entityCollections/*", (req, res) => {
    const url = new URL(`${req.protocol}://${req.get("host") ?? ""}${req.originalUrl}`);
    const collectionName = decodeURI(url.pathname).split("/").pop() ?? "";
    const collection = mapsManager.getEntityCollection(collectionName);
    if (collection) {
        res.send(collection);
    } else {
        res.send(`COULD NOT FIND COLLECTION: ${collectionName}`);
    }
});

app.get("/entityCollections", (req, res) => {
    res.send({
        collections: mapsManager.getEntityCollectionsNames(),
    });
});

app.get("/maps", (req, res, next) => {
    fs.readFile(`cache/${mapPath("/", req)}cached-map-names.txt`, "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            res.send([]);
            return;
        }
        res.send(JSON.parse(data));
    });
});

new UploadController(app, fileSystem);

app.use(proxyFiles(fileSystem));

app.listen(3000, () => {
    console.log("Application is running on port 3000");
});
