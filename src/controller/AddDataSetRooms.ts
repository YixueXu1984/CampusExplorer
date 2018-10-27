import {JSZipObject} from "jszip";
import {IRoom} from "../model/Room";
import * as JSZip from "jszip";
import {InsightDatasetKind} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";
import Log from "../Util";
import * as fs from "fs";
import {IDataSetRooms} from "../model/DataSetRooms";
import {stringify} from "querystring";
import {ICourseSection} from "../model/CourseSection";

export default class AddDataSetRooms {
    constructor() {
        Log.trace("Add dataset Rooms");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataSet> {
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
                    return this.iterateThroughFiles(zip, buildings, id, kind);
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
        const doc = parse5.parse(cont); // , {treeAdapter: parse5.treeAdapters.default}
        const tbodyNode = this.findTbody(doc);
        if (tbodyNode !== null && typeof (tbodyNode.childNodes) !== "undefined" && tbodyNode.childNodes.length > 0) {
            for (let child of tbodyNode.childNodes) {
                if (this.getAttr(child, "href") !== null) {
                    buildingPaths.push(this.getAttr(child, "href"));
                }
            }
        }
        for (let i of buildingPaths) {
            Log.trace(i);
        }
        return buildingPaths;
    }

    private findTbody(node: any): any {
        return this.findNode(node, "class", "views-table cols-5 table").childNodes[3];
    }

    private findNodeWithName(node: any, nodeName: string, attrKey: string, attrValue: string): any {
        if (typeof(node.attrs) !== "undefined") {
            for (let attr of node.attrs) {
                if (attr.name === attrKey && attr.value === attrValue && node.name === nodeName) {
                    return node;
                }
            }
        }
        if (typeof(node.childNodes) !== "undefined") {
            if (node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    if (this.findNodeWithName(child, nodeName, attrKey, attrValue) !== null) {
                        return this.findNodeWithName(child, nodeName, attrKey, attrValue);
                    }
                }
            }
        }
        return null;
    }

    private findNode(node: any, attrName: string, attrValue: string): any {
        if (typeof(node.attrs) !== "undefined") {
            for (let attr of node.attrs) {
                if (attr.name === attrName && attr.value === attrValue) {
                    return node;
                }
            }
        }
        if (typeof(node.childNodes) !== "undefined") {
            if (node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                        if (this.findNode(child, attrName, attrValue) !== null) {
                            return this.findNode(child, attrName, attrValue);
                        }
                }
            }
        }
        return null;
    }

    private getAttr(node: any, attrName: string): string {
        if (typeof (node.attrs) !== "undefined") {
            for (let attr of node.attrs) {
                if (attr.name === attrName && attr.value !== null) {
                    return attr.value;
                }
            }
        }
        if ( typeof (node.childNodes) !== "undefined") {
            if (node.childNodes.length > 0) {
                for (let child of node.childNodes) {
                    if (this.getAttr(child, attrName) !== null) {
                        return this.getAttr(child, attrName);
                    }
                }
            }
        }
        return null;
    }

    private iterateThroughFiles(cont: JSZip, buildingPaths: string[], id: string,
                                kind: InsightDatasetKind): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            let promisearr: Array<Promise<IRoom[]>> = [];
            let dataSet: IDataSetRooms = {
                id: "",
                numRows: 0,
                kind: InsightDatasetKind.Rooms,
                data: []
            };
            for (let path of buildingPaths) { // PROBLEM HERE
                cont.file(path).async("text") // cont.file(path) is null, causing an Type error to be thrown
                    .then((info) => {
                        promisearr.push(this.parseHtml(info)); // !!!!!
                    });
            }
            Promise.all(promisearr)
                .then((rooms) => {
                    let numRows: number = 0;
                    for (let room of rooms) {
                        if (room.length > 0) {
                            numRows = numRows + room.length;
                            dataSet.data = dataSet.data.concat(room);
                        }
                    }
                    dataSet.id = id;
                    dataSet.kind = kind;
                    dataSet.numRows = numRows;
                    resolve(dataSet);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private parseHtml(roominfo: string): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            let roomsHolder: { result: any[] };
            roomsHolder = {
                result: []
            };
            try {
                // todo
                let roomHolder: { cont: any[] };
                roomHolder = {
                    cont: []
                };

                const parse5 = require("parse5");
                const doc = parse5.parse(roominfo);

                // fill-in roomHolder
                let fullname = this.findNodeWithName(doc, "div", "id", "building-info").childNodes[1].
                    childNodes[0].childNodes[0].name;
                Log.trace("!!!!!!!!!!!!!" + fullname);

                if (doc !== null && typeof (doc.childNodes) !== "undefined"
                    && doc.childNodes.length > 0) {
                    for (let child of doc.childNodes) {
                        // todo
                        roomHolder.cont.push("!!!");
                    }
                    roomsHolder.result.push(roomHolder.cont);
                }
            } catch (err) {
                // skip rooms with invalid values
            }
            let rooms: IRoom[] = [];
            for (let room of roomsHolder.result) {
                let mRoom: IRoom = {
                    fullname: "",
                    shortname: "",
                    number: "",
                    name: "",
                    address: "",
                    lat: 0,
                    lon: 0,
                    seats: 0,
                    type: "",
                    furniture: "",
                    href: ""
                };
                if (this.checkValidRoom(room)) {
                    mRoom.fullname = room[0];
                    mRoom.shortname = room[1];
                    mRoom.number = room[3];
                    mRoom.name = room[4];
                    mRoom.address = room[5];
                    mRoom.lat = room[6];
                    mRoom.lon = room[7];
                    mRoom.seats = room[8];
                    mRoom.type = room[9];
                    mRoom.furniture = room[10];
                    mRoom.href = room[11];
                } else {
                    continue;
                }
                rooms.push(mRoom);
            }
            resolve(rooms); // !!!!!
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
