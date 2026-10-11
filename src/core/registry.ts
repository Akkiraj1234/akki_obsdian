import type { FeatureDefinition } from "./feature";
import hobbiesFeature from "../features/hobbies";
import newPageFeature from "../features/new-page";

export const featureRegistry = [
    hobbiesFeature, 
    newPageFeature
] as const satisfies readonly FeatureDefinition<object>[];
