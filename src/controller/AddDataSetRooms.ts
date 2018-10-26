import {JSZipObject} from "jszip";
import {IRoom} from "../model/Room";
import * as JSZip from "jszip";
import {InsightDatasetKind} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Log from "../Util";
import * as fs from "fs";
import {ICourseSection} from "../model/CourseSection";
import {IDataSetRooms} from "../model/DataSetRooms";
import {stringify} from "querystring";

export default class AddDataSetRooms {
    constructor() {
        Log.trace("Add dataset Rooms");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataSet> {
        // stub
        return new Promise((resolve, reject) => {
            if (id === null || id === undefined) {
                reject("invalid id");
            } else if (content === null || content === undefined) {
                reject("invalid content");
            } else if (kind !== InsightDatasetKind.Rooms) {
                reject("invalid kind");
            }

            let zip = new JSZip();
            zip.loadAsync(content, {base64: true})
                .then((zipFile) => {
                    return zipFile.file("index.htm").async("text");
                })
                .then((index) => {
                    return this.getBuildingsPaths(index);
                })
                .then((buildings) => {
                    return this.iterateThroughFiles(buildings, id, kind);
                })
                .then((dataset) => {
                    return this.cacheDataSet(dataset);
                })
                .then((dataSet) => {
                    resolve(dataSet);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private getBuildingsPaths(cont: string): string[] {
        let buildingPaths: string[] = [];
        const parse5 = require("parse5");
        const doc = parse5.doc(cont);
        doc.forEach((node: any) => {
            // todo
        });
        return buildingPaths;
    }

    private iterateThroughFiles(buildings: string[], id: string, kind: InsightDatasetKind): Promise<IDataSet> {
        return null;
    }

    private readEachHtmlFiles(building: JSZipObject): Promise<IRoom[]> {
        return null;
    }

    private parseIndexHtml(file: string): string[] {
        return null;
    }

    private checkValidRoom(room: any): boolean {
        if (room.fullname === null || room.fullname === undefined) {
            return false;
        } else if (room.shortname === null || room.shortname === undefined) {
            return false;
        } else if (room.number === null || room.number === undefined) {
            return false;
        } else if (room.name === null || room.name === undefined) {
            return false;
        } else if (room.address === null || room.address === undefined) {
            return false;
        } else if (room.lat === null || room.lat === undefined) {
            return false;
        } else if (room.lon === null || room.lon === undefined) {
            return false;
        } else if (room.seats === null || room.seats === undefined) {
            return false;
        } else if (room.type === null || room.type === undefined) {
            return false;
        } else if (room.furniture === null || room.furniture === undefined) {
            return false;
        } else if (room.href === null || room.href === undefined) {
            return false;
        } else {
            return true;
        }
    }

    private cacheDataSet(dataSet: IDataSet): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            fs.writeFile("data/" + dataSet.id + ".json", JSON.stringify(dataSet), (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(dataSet);
            });
        });
    }
}
