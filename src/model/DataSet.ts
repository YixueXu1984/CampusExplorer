import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourseSection} from "./CourseSection";
import {IRoom} from "./Room";

export interface IDataSet {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    courses: ICourseSection[];
}
