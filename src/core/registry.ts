import type { FeatureDefinition } from "./feature";
import hobbiesFeature from "../features/hobbies";

export const featureRegistry = [
    hobbiesFeature, 
] as const satisfies readonly FeatureDefinition<object>[];
