import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface IDataSet {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    courses: ICourse[];
}
