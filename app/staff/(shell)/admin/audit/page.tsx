"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { searchAuditLog } from "@/lib/api/admin";
import type { AuditLogEntry } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { extractItems, extractTotal, formatDateTime } from "@/lib/format";
import { NumberedPagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TAILLE = 30;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchAuditLog({ module: module || undefined, action: action || undefined, page, taille: TAILLE })
        .then((res) => {
          setLogs(extractItems(res));
          setTotal(extractTotal(res));
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger le journal."));
    }, 300);
    return () => clearTimeout(timeout);
  }, [module, action, page]);

  return (
    <div className="space-y-5">
      <PageHeader>
        <h1 className="text-2xl font-extrabold text-white">Journal d&apos;audit</h1>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(1);
            }}
            placeholder="Module (AUT, CLI, SHP, ADM...)"
            className="!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] text-brand-dark shadow-none"
          />
        </InputGroup>
        <InputGroup className="bg-transparent border-none p-0 h-auto shadow-none">
          <InputGroupInput
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            placeholder="Action (ex. USER_LOGIN)"
            className="!h-10 w-full rounded-[8px] border-[1.5px] border-white/20 bg-white/80 backdrop-blur-xl px-3 text-[13.5px] text-brand-dark shadow-none"
          />
        </InputGroup>
      </div>

      {error && <p className="text-[14px] font-semibold text-red-400">{error}</p>}

      {!logs ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Cible (Type · ID)</TableHead>
                  <TableHead>Utilisateur (ID)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-brand-grey py-10">
                      Aucune entrée trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap font-medium text-brand-orange">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold">{log.module}</TableCell>
                      <TableCell className="font-bold">{log.action}</TableCell>
                      <TableCell className="text-brand-grey">
                        {log.cibleType ? `${log.cibleType} · ${log.cibleId?.slice(0, 8)}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {log.utilisateurId?.slice(0, 8) ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 pt-4">
            <NumberedPagination
              page={page}
              totalPages={total !== null ? Math.max(1, Math.ceil(total / TAILLE)) : page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
