import {JSZipObject} from "jszip";
import {IRoom} from "../model/Room";
import * as JSZip from "jszip";
import {InsightDatasetKind} from "./IInsightFacade";
import {IDataSet} from "../model/DataSet";

export default class AddDataSetRooms {

    constructor() {
        // stub
    }

    private readHtmlFiles(buildings: JSZipObject): Promise<IRoom[]> {
        // stub
        return null;
    }

    private checkValidRoom(building: any): boolean {
        // stub
        return true;
    }

    private isLinkedInIndex(building: any): boolean {
        // stub
        return true;
    }

    private parseHtml(rooms: string): IRoom[] {
        return null;
    }

    private iterateThroughFile(courses: JSZip, id: string, kind: InsightDatasetKind): Promise<IDataSet> {
        // stub
        return null;
    }

    private cacheDataset(dataSet: IDataSet): Promise<IDataSet> {
        // stub
        return null;
    }

    private addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<IDataSet> {
        // stub
        return null;
    }
}
