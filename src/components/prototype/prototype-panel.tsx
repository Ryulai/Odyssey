import { useState } from "react";
import { usePrototype } from "@/lib/prototype/use-prototype";
import { PROTOTYPE_RANKS } from "@/lib/prototype/ranks";
import { PRIMARY_CLASSES, CLASS_ROLES } from "@/lib/rpg";
import type { PrototypeProfile, PrototypeSecondary, PrototypeGrade } from "@/lib/prototype/types";

const GRADES: PrototypeGrade[] = ["S", "A", "B", "C", "D", "—"];

export function PrototypePanel({ onClose }: { onClose: () => void }) {
  const { enabled, profiles, activeProfileId, active, actions } = usePrototype();
  const [tab, setTab] = useState<"profiles" | "editor">("profiles");

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end bg-black/60" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-amber-500/40 bg-[#0A0F1E] p-5 text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-display text-xs uppercase tracking-[0.3em] text-amber-300">Prototype Mode</div>
            <div className="text-[10px] text-muted-foreground">Client-only. Never affects production.</div>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </header>

        {/* Enable switch */}
        <div className="mb-4 flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div>
            <div className="text-xs font-semibold text-amber-200">Enabled</div>
            <div className="text-[10px] text-muted-foreground">Overlay demo data on your dashboard</div>
          </div>
          <button
            onClick={() => actions.setEnabled(!enabled)}
            className={`h-6 w-12 rounded-full border transition ${
              enabled ? "border-amber-400 bg-amber-400" : "border-border bg-ink"
            }`}
          >
            <span
              className={`block h-5 w-5 translate-y-[-1px] rounded-full bg-white transition ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-1 rounded border border-border p-1 text-xs">
          {(["profiles", "editor"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded px-2 py-1.5 uppercase tracking-widest ${
                tab === t ? "bg-amber-500/20 text-amber-200" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "profiles" ? (
          <ProfilesTab
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={(id) => actions.setActiveProfile(id)}
            onAdd={() => actions.addProfile()}
            onRemove={(id) => actions.removeProfile(id)}
            onReset={() => actions.resetToSeed()}
          />
        ) : (
          <EditorTab profile={active} onChange={(patch) => active && actions.updateProfile(active.id, patch)} />
        )}
      </aside>
    </div>
  );
}

function ProfilesTab(props: {
  profiles: PrototypeProfile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {props.profiles.map((p) => {
          const isActive = p.id === props.activeProfileId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-md border p-3 ${
                isActive ? "border-amber-400 bg-amber-500/5" : "border-border bg-ink/40"
              }`}
            >
              <button className="text-left" onClick={() => props.onSelect(p.id)}>
                <div className="text-sm font-medium text-foreground">{p.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.name} · {p.rankKey} · {p.primaryClass}
                  {p.secondaries.length ? ` · +${p.secondaries.length} sec.` : ""}
                </div>
              </button>
              <button
                onClick={() => props.onRemove(p.id)}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-300"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={props.onAdd}
          className="flex-1 rounded border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs uppercase tracking-widest text-amber-200"
        >
          + New Profile
        </button>
        <button
          onClick={props.onReset}
          className="rounded border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground"
        >
          Reset seeds
        </button>
      </div>
    </div>
  );
}

function EditorTab({
  profile,
  onChange,
}: {
  profile: PrototypeProfile | null;
  onChange: (patch: Partial<PrototypeProfile>) => void;
}) {
  if (!profile) {
    return (
      <div className="rounded border border-border bg-ink/30 p-4 text-center text-xs text-muted-foreground">
        Enable Prototype Mode and pick a profile to edit.
      </div>
    );
  }

  const roles = CLASS_ROLES[profile.primaryClass as keyof typeof CLASS_ROLES] ?? [];

  return (
    <div className="space-y-4 text-xs">
      <Field label="Label">
        <input
          value={profile.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>
      <Field label="Name">
        <input
          value={profile.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>

      <Field label="Rank">
        <Select value={profile.rankKey} onChange={(v) => onChange({ rankKey: v })}>
          {PROTOTYPE_RANKS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Primary Class">
        <Select value={profile.primaryClass} onChange={(v) => onChange({ primaryClass: v, primaryRole: undefined })}>
          {PRIMARY_CLASSES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      {roles.length > 0 && (
        <Field label="Primary Role">
          <Select value={profile.primaryRole ?? ""} onChange={(v) => onChange({ primaryRole: v || undefined })}>
            <option value="">—</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <SecondaryEditor
        secondaries={profile.secondaries}
        onChange={(next) => onChange({ secondaries: next })}
      />

      <Field label="Monthly Grade">
        <Select value={profile.monthlyGrade} onChange={(v) => onChange({ monthlyGrade: v as PrototypeGrade })}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`Legacy Stars · ${profile.legacyStars}`}>
        <input
          type="range"
          min={0}
          max={2000}
          value={profile.legacyStars}
          onChange={(e) => onChange({ legacyStars: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      <Field label="Legacy Title">
        <input
          value={profile.legacyTitle ?? ""}
          onChange={(e) => onChange({ legacyTitle: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>

      <Field label="Business Unit">
        <input
          value={profile.businessUnit ?? ""}
          onChange={(e) => onChange({ businessUnit: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>
      <Field label="Fleet">
        <input
          value={profile.fleet ?? ""}
          onChange={(e) => onChange({ fleet: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>
      <Field label="Manager">
        <input
          value={profile.manager ?? ""}
          onChange={(e) => onChange({ manager: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>
      <Field label="Motto">
        <input
          value={profile.motto ?? ""}
          onChange={(e) => onChange({ motto: e.target.value })}
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>

      <Field label="Collections (comma-separated)">
        <input
          value={profile.collections.join(", ")}
          onChange={(e) =>
            onChange({
              collections: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
          className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
        />
      </Field>
    </div>
  );
}

function SecondaryEditor({
  secondaries,
  onChange,
}: {
  secondaries: PrototypeSecondary[];
  onChange: (next: PrototypeSecondary[]) => void;
}) {
  return (
    <div className="rounded border border-border bg-ink/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-amber-200">Secondary Classes</div>
        <button
          onClick={() =>
            onChange([
              ...secondaries,
              {
                id: `sec-${Date.now().toString(36)}`,
                className: "Scholar",
                role: "",
                rankKey: "bronze",
                progress: 0,
              },
            ])
          }
          className="text-[10px] uppercase tracking-widest text-amber-300"
        >
          + Add
        </button>
      </div>
      {secondaries.length === 0 && (
        <div className="text-[10px] text-muted-foreground">None. Prototype accounts may equip any number.</div>
      )}
      <div className="space-y-2">
        {secondaries.map((sec, idx) => (
          <div key={sec.id} className="space-y-1.5 rounded border border-border/60 bg-ink/60 p-2">
            <div className="flex gap-1">
              <input
                value={sec.className}
                placeholder="Class"
                onChange={(e) => {
                  const next = [...secondaries];
                  next[idx] = { ...sec, className: e.target.value };
                  onChange(next);
                }}
                className="w-full rounded border border-border bg-ink/40 px-2 py-1"
              />
              <input
                value={sec.role ?? ""}
                placeholder="Role"
                onChange={(e) => {
                  const next = [...secondaries];
                  next[idx] = { ...sec, role: e.target.value };
                  onChange(next);
                }}
                className="w-full rounded border border-border bg-ink/40 px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sec.rankKey}
                onChange={(v) => {
                  const next = [...secondaries];
                  next[idx] = { ...sec, rankKey: v };
                  onChange(next);
                }}
              >
                {PROTOTYPE_RANKS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <input
                type="range"
                min={0}
                max={100}
                value={sec.progress}
                onChange={(e) => {
                  const next = [...secondaries];
                  next[idx] = { ...sec, progress: Number(e.target.value) };
                  onChange(next);
                }}
                className="flex-1"
              />
              <button
                onClick={() => onChange(secondaries.filter((_, i) => i !== idx))}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-border bg-ink/40 px-2 py-1.5"
    >
      {children}
    </select>
  );
}
