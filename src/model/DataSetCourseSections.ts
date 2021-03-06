import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourseSection} from "./CourseSection";
import {IDataSet} from "./DataSet";

export class IDataSetCourseSections implements IDataSet {
    public id: string;
    public kind: InsightDatasetKind;
    public numRows: number;
    public data: ICourseSection[];
}
