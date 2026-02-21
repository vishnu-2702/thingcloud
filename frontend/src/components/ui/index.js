/**
 * Design System - UI Components
 * 
 * A collection of reusable, accessible UI components following
 * professional design principles with consistent spacing, typography,
 * and interaction patterns.
 */

export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Modal } from './Modal';
export { default as Spinner } from './Spinner';
export { default as EmptyState } from './EmptyState';
export { default as StatusDot } from './StatusDot';
export { default as PageHeader } from './PageHeader';
export { default as StatCard } from './StatCard';
export { default as Tooltip } from './Tooltip';

// Card sub-components (also available as Card.Header, Card.Body, etc.)
import Card from './Card';
export const CardHeader = Card.Header;
export const CardTitle = Card.Title;
export const CardDescription = Card.Description;
export const CardBody = Card.Body;
export const CardFooter = Card.Footer;
