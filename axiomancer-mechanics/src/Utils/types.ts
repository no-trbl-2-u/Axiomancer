/**
 * Image represents an image asset with accessibility and source information
 * @property alt - Alternative text description for accessibility and when image fails to load
 * @property src - Source path or URL to the image file
 */
export interface Image {
    alt: string;
    src: string;
}