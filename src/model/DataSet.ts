import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourse} from "./Course";

export interface IDataSet {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    courses: ICourse[];
}
