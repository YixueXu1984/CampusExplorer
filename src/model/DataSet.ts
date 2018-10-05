import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourseSection} from "./CourseSection";

export interface IDataSet {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    courses: ICourseSection[];
}
