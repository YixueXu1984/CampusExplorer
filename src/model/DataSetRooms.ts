import {InsightDatasetKind} from "../controller/IInsightFacade";
import {IRoom} from "./Room";
import {IDataSet} from "./DataSet";

export class IDataSetRooms implements IDataSet {
    public id: string;
    public kind: InsightDatasetKind;
    public numRows: number;
    public data: IRoom[];
}
