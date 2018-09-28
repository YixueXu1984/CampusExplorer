import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface IDataSet {
    id: string;
    kind: InsightDatasetKind;
    courses: ICourse[];
}
