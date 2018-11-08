import {InsightDataset} from "../controller/IInsightFacade";

export interface IResponse {
    code: number;
    body: InsightDataset[] | string[] | string;
}
