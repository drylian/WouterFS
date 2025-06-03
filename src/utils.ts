import fs from 'fs';
import path from 'path';
import type { RouteDefinition } from './types';

/**
 * General utility functions
 */

export function capitalize(str: string): string {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
export function formatName(str: string): string {
    return str
        .replaceAll("[", "")
        .replaceAll("]", "")
        .replaceAll("(", "")
        .replaceAll(")", "")
        .replaceAll("{", "")
        .replaceAll("}", "")
        .replaceAll(".", " ")
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replaceAll("/", " ")
        .replaceAll("\\", " ")
        .replaceAll("*", "Wildcard")
        .replaceAll(":", "Param")
        .replaceAll("?", "Optional")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^index$/i, "Index")
        .replace(/^page$/i, "Page")
        .replace(/^home$/i, "Home");
}

export function capitalizeWords(str: string): string {
    if (!str || typeof str !== 'string') return str;
    return str.replaceAll("_", " ").replaceAll("-", " ").split(' ').map(word => capitalize(word)).join(' ');
}

export function getAllFiles(dir: string): string[] {
    return fs.readdirSync(dir).flatMap(f => {
        const full = path.join(dir, f);
        return fs.statSync(full).isDirectory() ? getAllFiles(full) : full;
    });
}

export function displayRoutes(routes: RouteDefinition[]): void {
    console.table(routes.map(r => ({
        Type: r.type,
        Path: r.routePath,
        File: path.relative(process.cwd(), r.filePath),
    })));
}