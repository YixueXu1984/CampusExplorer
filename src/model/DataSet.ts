import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourseSection} from "./CourseSection";
import {IRoom} from "./Room";

export class IDataSet {
    public id: string;
    public kind: InsightDatasetKind;
    public numRows: number;
    public data: any[];
}
