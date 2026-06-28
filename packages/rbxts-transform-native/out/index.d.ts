import ts from "typescript";
import type { PluginConfig } from "./config";
export type { PluginConfig };
export default function (program: ts.Program, config?: PluginConfig): ts.TransformerFactory<ts.SourceFile>;
