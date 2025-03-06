/**
 * Plugins system for Boostify Admin
 * 
 * This file exports all the plugin components that can be used in the Plugins page.
 * Each plugin provides specialized functionality for managing different aspects of the platform.
 */

// BeatNews: Plugin for automatic music news aggregation and publishing
export { BeatNewsPlugin } from "./beatnews-plugin";

// ContentPulse: Plugin for AI-powered content curation and generation
export { ContentPulsePlugin } from "./contentpulse-plugin";

// SocialSync: Plugin for social media management and analytics
export { SocialSyncPlugin } from "./socialsync-plugin";

// EventBeat: Plugin for music event tracking and promotion
export { EventBeatPlugin } from "./eventbeat-plugin";