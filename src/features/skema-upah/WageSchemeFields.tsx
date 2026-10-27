"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@mestakara/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@mestakara/ui/field";
import { Input } from "@mestakara/ui/input";

import { FieldNote } from "@/components/shared/FieldNote";
import { SelectField, TextField, type SelectOption } from "@/components/shared/FormFields";
import { dailyRate, formatRupiah, parseRupiah, toRupiahText, WAGE_TYPE, WAGE_TYPES } from "@/lib/wage-rules";

import { BULK_FIELDS, type BulkField, type SkemaFormValues } from "./skema-upah-form-values";

/** Ubah satu isian form skema. */
type ChangeValue = <K extends keyof SkemaFormValues>(key: K, value: SkemaFormValues[K]) => void;

interface WageSchemeFieldsProps {
  values: SkemaFormValues;
  onChange: ChangeValue;
  errors: Partial<Record<keyof SkemaFormValues, string>>;
  disabled: boolean;
  payrollGroupOptions: SelectOption[];
  /**
   * Mode UBAH SEKALIGUS: setiap kelompok isian diberi kotak "Ubah". Isian yang tidak dicentang
   * tidak bisa diketik dan tidak dikirim. Kosongkan untuk dialog satu karyawan.
   */
  bulk?: { enabled: Record<BulkField, boolean>; onToggle: (field: BulkField, enabled: boolean) => void };
}

/**
 * ISIAN SKEMA UPAH (dipakai dialog Ubah Skema & Ubah Sekaligus):
 *
 *   Jenis Upah [Harian ▾]        Gaji Pokok [2.375.000]   HKE [25]     -> Rp/hari Rp 95.000
 *   Batas Hari Kerja                       (label di atas, seperti isian lain)
 *   ☑ Dibatasi maksimal [20] hari kerja
 *   Tunjangan Operasional & Jabatan [0]   Insentif [0]
 *   Uang Makan
 *   ☑ Diberi uang makan sebesar Rp [15.000] per hari kerja
 *   Kelompok Daftar Upah [Tanpa kelompok ▾]
 */
export function WageSchemeFields({ values, onChange, errors, disabled, payrollGroupOptions, bulk }: WageSchemeFieldsProps) {
  /** Isian rupiah: diketik bebas, ditampilkan berpemisah ribuan. */
  const rupiah = (text: string) => toRupiahText(parseRupiah(text));

  /** Apakah kelompok isian ini boleh diketik? (mode biasa: selalu boleh) */
  const isOn = (field: BulkField) => !bulk || bulk.enabled[field];

  const baseSalary = parseRupiah(values.base_salary) ?? 0;
  const workingDays = Number(values.working_days);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        <Group bulk={bulk} disabled={disabled} field="wage_type">
          <SelectField
            id="wage_type"
            label="Jenis Upah"
            required
            options={WAGE_TYPES}
            value={values.wage_type}
            onChange={(value) => onChange("wage_type", value)}
            error={errors.wage_type}
            disabled={disabled || !isOn("wage_type")}
            note={
              values.wage_type === WAGE_TYPE.flat
                ? "Gaji Pokok penuh; prorata kalau masuk / berhenti di tengah bulan."
                : "dibayar per hari berkode K."
            }
          />
        </Group>
        <Group bulk={bulk} disabled={disabled} field="base_salary">
          <TextField
            id="base_salary"
            label="Gaji Pokok"
            required
            inputMode="numeric"
            value={values.base_salary}
            onChange={(value) => onChange("base_salary", rupiah(value))}
            error={errors.base_salary}
            disabled={disabled || !isOn("base_salary")}
            placeholder="Cth. 2.375.000"
          />
        </Group>
        <Group bulk={bulk} disabled={disabled} field="working_days">
          <TextField
            id="working_days"
            label="HKE (Hari Kerja Efektif)"
            required
            inputMode="numeric"
            value={values.working_days}
            onChange={(value) => onChange("working_days", value.replace(/\D/g, ""))}
            error={errors.working_days}
            disabled={disabled || !isOn("working_days")}
            note={
              baseSalary > 0 && workingDays > 0
                ? `Rp/hari = ${formatRupiah(dailyRate(baseSalary, workingDays))}.`
                : "bawaan 25. Rp/hari = Gaji Pokok ÷ HKE."
            }
          />
        </Group>
      </div>

      <Group bulk={bulk} disabled={disabled} field="cap">
        <Field data-invalid={Boolean(errors.cap_days)}>
          <FieldLabel htmlFor="cap_days">Batas Hari Kerja</FieldLabel>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 typo-body-m">
              <Checkbox
                checked={values.is_capped}
                onCheckedChange={(checked) => onChange("is_capped", checked === true)}
                disabled={disabled || !isOn("cap")}
              />
              Dibatasi maksimal
            </label>
            {/* Kotak angka sebaris dengan centang & tulisan; labelnya "Batas Hari Kerja" di atas baris. */}
            <Input
              id="cap_days"
              aria-label="Batas hari kerja"
              inputMode="numeric"
              value={values.cap_days}
              onChange={(event) => onChange("cap_days", event.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(errors.cap_days)}
              disabled={disabled || !isOn("cap") || !values.is_capped}
              className="w-20"
            />
            <span className="typo-body-m">hari kerja</span>
          </div>
          <FieldNote>kelebihan hari kerja dari batas ini dibayar sebagai Lembur DW.</FieldNote>
          <FieldError>{errors.cap_days}</FieldError>
        </Field>
      </Group>

      <div className="grid gap-5 md:grid-cols-2">
        <Group bulk={bulk} disabled={disabled} field="operational_position_allowance">
          <TextField
            id="operational_position_allowance"
            label="Tunjangan Operasional & Jabatan"
            inputMode="numeric"
            value={values.operational_position_allowance}
            onChange={(value) => onChange("operational_position_allowance", rupiah(value))}
            error={errors.operational_position_allowance}
            disabled={disabled || !isOn("operational_position_allowance")}
            note="per bulan, bawaan 0."
          />
        </Group>
        <Group bulk={bulk} disabled={disabled} field="incentive">
          <TextField
            id="incentive"
            label="Insentif"
            inputMode="numeric"
            value={values.incentive}
            onChange={(value) => onChange("incentive", rupiah(value))}
            error={errors.incentive}
            disabled={disabled || !isOn("incentive")}
            note="per bulan, bawaan 0."
          />
        </Group>
      </div>

      <Group bulk={bulk} disabled={disabled} field="meal">
        <Field data-invalid={Boolean(errors.meal_allowance_per_day)}>
          <FieldLabel htmlFor="meal_allowance_per_day">Uang Makan</FieldLabel>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 typo-body-m">
              <Checkbox
                checked={values.has_meal_allowance}
                onCheckedChange={(checked) => onChange("has_meal_allowance", checked === true)}
                disabled={disabled || !isOn("meal")}
              />
              Diberi uang makan
            </label>
            {values.has_meal_allowance && (
              <>
                <span className="typo-body-m">sebesar Rp</span>
                <Input
                  id="meal_allowance_per_day"
                  aria-label="Uang Makan per Hari"
                  inputMode="numeric"
                  value={values.meal_allowance_per_day}
                  onChange={(event) => onChange("meal_allowance_per_day", rupiah(event.target.value))}
                  aria-invalid={Boolean(errors.meal_allowance_per_day)}
                  disabled={disabled || !isOn("meal")}
                  placeholder="Cth. 15.000"
                  className="w-36"
                />
                <span className="typo-body-m">per hari kerja</span>
              </>
            )}
          </div>
          <FieldNote>
            {values.has_meal_allowance
              ? "uang makan dikali jumlah hari berkode K."
              : "centang kalau karyawan diberi uang makan harian."}
          </FieldNote>
          <FieldError>{errors.meal_allowance_per_day}</FieldError>
        </Field>
      </Group>

      <Group bulk={bulk} disabled={disabled} field="payroll_group_id">
        <SelectField
          id="payroll_group_id"
          label="Kelompok Daftar Upah"
          options={payrollGroupOptions}
          emptyLabel="Tanpa kelompok"
          value={values.payroll_group_id}
          onChange={(value) => onChange("payroll_group_id", value)}
          error={errors.payroll_group_id}
          disabled={disabled || !isOn("payroll_group_id")}
          note="opsional. Dipakai kalau Daftar Upah dikelompokkan secara Legacy."
        />
      </Group>
    </>
  );
}

/**
 * Satu kelompok isian. Di mode Ubah Sekaligus dibungkus kotak berisi centang "Ubah ...";
 * di mode biasa isiannya tampil apa adanya.
 *
 * Sengaja ditulis di LUAR WageSchemeFields: komponen yang dibuat di dalam komponen lain dibuat ulang
 * setiap kali diketik, sehingga kursor keluar dari isian.
 */
function Group({
  field,
  bulk,
  disabled,
  children,
}: {
  field: BulkField;
  bulk: WageSchemeFieldsProps["bulk"];
  disabled: boolean;
  children: ReactNode;
}) {
  if (!bulk) return <>{children}</>;
  const label = BULK_FIELDS.find((item) => item.key === field)?.label ?? field;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <label className="flex cursor-pointer items-center gap-2 typo-label-m text-fg-heading">
        <Checkbox
          checked={bulk.enabled[field]}
          onCheckedChange={(checked) => bulk.onToggle(field, checked === true)}
          disabled={disabled}
        />
        Ubah {label}
      </label>
      {children}
    </div>
  );
}
