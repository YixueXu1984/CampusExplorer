import {JSZipObject} from "jszip";
import {IRoom} from "../model/Room";
import * as JSZip from "jszip";
import {InsightDatasetKind} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Log from "../Util";
import * as fs from "fs";
import {ICourseSection} from "../model/CourseSection";
import {IDataSetRoom} from "../model/DataSetRoom";

export default class AddDataSetRooms {

    private buildingList: string[];

    constructor() {
        Log.trace("Add dataset Rooms");
    }

    private readIndexFile(folder: JSZipObject): void {
        this.buildingList = this.parseIndexHtml(folder);
    }

    private parseIndexHtml(building: JSZipObject): string[] {
        let buildingList: string[] = [];
        let parse5 = require("parse5");
        let document = parse5.parse();
        return buildingList;
    }

    private getBuildingIndex(): string[] {
        // stub
        return null;
    }

    private isLinkedInIndex(room: any): boolean {
        // stub
        return true;
    }

    private readEachHtmlFiles(building: JSZipObject): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            building.async("text")
                .then((rooms) => {
                    return this.parseHtml(rooms);
                })
                .then ((roomModel) => {
                    resolve(roomModel);
                })
                .catch((err) => {
                    reject(err);
                });
        });
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

    private parseHtml(rooms: string): IRoom[] {
        // stub
        return null;
    }

    private iterateThroughFiles(courses: JSZip, id: string, kind: InsightDatasetKind): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            let promisearr: Array<Promise<IRoom[]>> = [];
            let dataSet: IDataSetRoom = {
                id: "",
                numRows: 0,
                kind: InsightDatasetKind.Rooms,
                rooms: []
            };
            courses.folder("rooms").forEach((relativePath, room) => {
                promisearr.push(this.readEachHtmlFiles(room));
            });

            Promise.all(promisearr)
                .then((rooms) => {
                    let numRows: number = 0;
                    for (let room of rooms) {
                        if (room.length > 0) {
                            numRows = numRows + room.length;
                            dataSet.rooms = dataSet.rooms.concat(room);
                            // Only add a course if it has at least one section in it
                        }
                    }
                    if (dataSet.rooms.length === 0) { // This dataSet has no courses in it, or no valid sections
                        throw new Error("Invalid dataset, no valid room");
                    } else {
                        dataSet.id = id;
                        dataSet.kind = kind;
                        dataSet.numRows = numRows;
                        // resolve(dataSet); // !!!
                    }
                })
                .catch((err) => {
                    reject(err);
                });

        });
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
                .then((courses) => {
                    return this.iterateThroughFiles(courses, id, kind);
                })
                .then((dataSet) => {
                    // cache dataSet here
                    return this.cacheDataSet(dataSet);
                })
                .then((dataSet) => {
                    resolve(dataSet);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}
