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
import GetGeoLocation from "./GetGeoLocation";
import {IBuilding} from "../model/IBuilding";

export default class AddDataSetRooms {
    constructor() {
        Log.trace("Add dataset Rooms");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            try {
                if (id === null || id === undefined) {
                    reject("invalid id");
                } else if (content === null || content === undefined) {
                    reject("invalid content");
                } else if (kind !== InsightDatasetKind.Rooms) {
                    reject("invalid kind");
                }
                let zip = new JSZip();
                let zipFileProm = zip.loadAsync(content, {base64: true});
                let indexProm = zipFileProm.then((zipFile) => {
                    return zipFile.file("index.htm").async("text");
                });
                let buildingsProm = indexProm.then((index) => {
                    return this.getBuildingsFilePaths(index);
                });

                Promise.all([zipFileProm, indexProm, buildingsProm])
                    .then((promiseResults) => {
                        return this.iterateThroughFiles(promiseResults[0], promiseResults[2], id, kind);
                    })
                    .then((dataSet) => {
                        return this.cacheDataSet(dataSet);
                    })
                    .then((dataSet) => {
                        resolve(dataSet);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }
        });
    }

    private getBuildingsFilePaths(cont: string): any[] {
        // an interface would be nice here
        let buildingPaths: any[] = [];
        const parse5 = require("parse5");
        let root: any;
        try {
            root = parse5.parse(cont);
        } catch (err) {
            throw new Error("invalid html format");
        }// , {treeAdapter: parse5.treeAdapters.default}
        let tbodyNode = this.findNode(root, "tbody");
        if (tbodyNode === null) {
            throw new Error("failed to find tBody in index.html");
        }
        tbodyNode.childNodes.forEach((building: any) => {
            if (building.nodeName === "tr") {
                buildingPaths.push(this.extractBuildingMetaInfo(building));
            }
        });
        return buildingPaths;
    }

    private extractBuildingMetaInfo(buildingNode: any): IBuilding {
        let building: IBuilding = {
            fullName: "",
            shortName: "",
            address: "",
            filePath: ""
        };
        // get path
        let pathNode = buildingNode.childNodes[5];
        building.filePath = this.getAttr(pathNode.childNodes[1].attrs, "href").substring(2);

        // get shortname
        let sNameNode = buildingNode.childNodes[3];
        building.shortName = sNameNode.childNodes[0].value.trim();

        // get fullname
        let fNameNode = pathNode.childNodes[1];
        building.fullName = fNameNode.childNodes[0].value.trim();

        let addressNode = buildingNode.childNodes[7];
        building.address = addressNode.childNodes[0].value.trim();

        return building;

    }

    private findNode(node: any, nodeName: string): any {
        let nodeFound: any = null;
        if (node.nodeName === nodeName) {
            return node;
        } else if (node.childNodes !== undefined) {
            for (let childNode of node.childNodes) {
                nodeFound = this.findNode(childNode, nodeName);
                if (nodeFound !== null) {
                    return nodeFound;
                }
            }
        }
        return null;
    }

    private getAttr(attrs: any[], attrName: string): string {
        let attribute = attrs.find((attr) => {
            return attr.name === attrName;
        });
        return attribute.value;
    }

    private iterateThroughFiles(cont: JSZip, buildings: IBuilding[], id: string,
                                kind: InsightDatasetKind): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            let promiseFiles: Array<Promise<string>> = [];
            let dataSet: IDataSetRooms = {
                id: "",
                numRows: 0,
                kind: InsightDatasetKind.Rooms,
                data: []
            };
            for (let building of buildings) {
                promiseFiles.push(cont.file(building.filePath).async("text"));
            }

            Promise.all(promiseFiles)
                .then((htmlFiles) => {
                    return this.parseHtmls(htmlFiles, buildings);
                })
                .then((allRooms) => {
                    dataSet.id = id;
                    dataSet.numRows = allRooms.length;
                    dataSet.data = allRooms;
                    resolve(dataSet);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private parseHtmls(htmlFiles: string[], buildings: IBuilding[]): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            let promiseRooms: Array<Promise<IRoom[]>> = [];
            let allRooms: IRoom[] = [];
            let i;
            for (i = 0; i < htmlFiles.length; i++) {
                promiseRooms.push(this.parseHtml(htmlFiles[i], buildings[i]));
            }
            Promise.all(promiseRooms)
                .then((roomss) => {
                    for (let rooms of roomss) {
                        if (rooms.length > 0) {
                            allRooms = allRooms.concat(rooms);
                        }
                    }
                    resolve(allRooms);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private parseHtml(roominfo: string, building: IBuilding): Promise<IRoom[]> {
        return new Promise((resolve, reject) => {
            let rooms: IRoom[] = [];
            try {
                const parse5 = require("parse5");
                const doc = parse5.parse(roominfo);
                let promiseArr: Array<Promise<IRoom>> = [];

                let tbodyNode = this.findNode(doc, "tbody");
                if (tbodyNode === null || tbodyNode === undefined) {
                    resolve(rooms);
                }

                for (let roomNode of tbodyNode.childNodes) {
                    if (roomNode.nodeName === "tr") {
                        promiseArr.push(this.parseRoom(roomNode, building));
                    }
                }

                Promise.all(promiseArr)
                    .then((promisedRooms) => {
                        promisedRooms.forEach((promisedRoom) => {
                            if (this.checkValidRoom(promisedRoom)) {
                                rooms.push(promisedRoom);
                            }
                        });
                        resolve(rooms);
                    })
                    .catch((err) => {
                        reject(err);
                    });

            } catch (err) {
                // skip rooms with invalid values
                reject(err); // dont think we need this hmm boasdfall
            }
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

    private parseRoom(roomNode: any, building: IBuilding): Promise<IRoom> {
        return new Promise<IRoom>((resolve, reject) => {
            // TODO: too much hardcoding ???
            try {
                let room: IRoom = {
                    fullname: "",
                    shortname: "",
                    number: "",
                    name: "",
                    address: "",
                    lat: -Infinity,
                    lon: -Infinity,
                    seats: -Infinity,
                    type: "",
                    furniture: "",
                    href: ""
                };
                room.address = building.address;
                room.fullname = building.fullName;
                room.shortname = building.shortName;
                // parse number
                let numberNode = roomNode.childNodes[1];
                room.number = numberNode.childNodes[1].childNodes[0].value.trim();
                // parse seats
                let seatNode = roomNode.childNodes[3];
                room.seats = Number(seatNode.childNodes[0].value.trim());
                // parse furniture
                let furnitureNode = roomNode.childNodes[5];
                room.furniture = furnitureNode.childNodes[0].value.trim();
                // parse type
                let typeNode = roomNode.childNodes[7];
                room.type = typeNode.childNodes[0].value.trim();
                // parse href
                let hrefNode = roomNode.childNodes[9];
                room.href = this.getAttr(hrefNode.childNodes[1].attrs, "href");

                room.name = building.shortName + "_" + room.number;
                room.lat = 1;
                room.lon = 1;
                resolve(room);
                // let geoLocator = new GetGeoLocation();
                // geoLocator.getGeoLocation(room.address)
                //     .then((latLon) => {
                //         room.lat = latLon[0];
                //         room.lon = latLon[1];
                //         resolve(room);
                //     })
                //     .catch((err) => {
                //         room.lat = null;
                //         room.lon = null;
                //         resolve(room);
                //     });
            } catch (err) {
                reject(err);
            }
        });
    }

    private cacheDataSet(dataSet: IDataSet): Promise<IDataSet> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync("data/")) {
                fs.mkdirSync("data/");
            }
            fs.writeFile("data/" + dataSet.id + ".json", JSON.stringify(dataSet), (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(dataSet);
            });
        });
    }
}
