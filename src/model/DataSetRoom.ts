import {InsightDatasetKind} from "../controller/IInsightFacade";
import {ICourseSection} from "./CourseSection";
import {IRoom} from "./Room";

export interface IDataSetRoom {
    id: string;
    kind: InsightDatasetKind;
    numRows: number;
    rooms: IRoom[];
}
