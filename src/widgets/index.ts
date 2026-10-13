/**
 * Central registry of widgets available to the Akki Obsidian plugin.
 *
 * Each registered widget provides its definition, including its unique
 * identifier, default settings, initialization logic, and other behavior
 * required by the application coordinator.
 *
 * The application uses this registry to discover which widgets to initialize,
 * manage their lifecycle, and prepare their settings.
 *
 * To add a new widget to the plugin, import its definition and include it
 * in this collection.
 */
import type { WidgetDefinition } from '@/core/types';
import { hobbieTrackerWidget } from './hobbie_tracker/index';


/**
 * Collection of widget definitions registered with the plugin.
 *
 * This list determines which widgets are available to the application.
 */
export const WIDGETS: WidgetDefinition[] = [
    hobbieTrackerWidget
];