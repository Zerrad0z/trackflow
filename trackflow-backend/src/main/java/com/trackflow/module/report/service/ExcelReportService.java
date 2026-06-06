package com.trackflow.module.report.service;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import com.trackflow.module.form.entity.FormType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelReportService {

    @Value("${app.storage.reports-dir}")
    private String reportsDir;

    private static final Map<String, Map<String, String>> translations = Map.of(
            "fr", Map.ofEntries(
                    Map.entry("Form ID", "ID Formulaire"),
                    Map.entry("Type", "Type"),
                    Map.entry("Status", "Statut"),
                    Map.entry("Uploaded By", "Téléchargé par"),
                    Map.entry("Uploaded At", "Téléchargé le"),
                    Map.entry("Confirmed At", "Confirmé le"),
                    Map.entry("Confirmed By", "Confirmé par"),
                    Map.entry("Generated", "Généré"),
                    Map.entry("Total forms", "Total formulaires"),
                    Map.entry("forms", "formulaires"),
                    Map.entry("RAPPORT_M", "Rapport M"),
                    Map.entry("LETTRE_SOMMATION_BILLET", "Sommation Billet"),
                    Map.entry("LETTRE_SOMMATION_CARTE", "Sommation Carte"),
                    Map.entry("UPLOADED", "Téléchargé"),
                    Map.entry("OCR_PROCESSING", "Traitement OCR"),
                    Map.entry("PENDING_VALIDATION", "En attente de validation"),
                    Map.entry("PENDING_CONFIRMATION", "En attente de confirmation"),
                    Map.entry("CONFIRMED", "Validé"),
                    Map.entry("ARCHIVED", "Archivé"),
                    Map.entry("Forms Report", "Rapport des formulaires"),
                    Map.entry("Detailed Export", "Export détaillé")
            ),
            "en", Map.of() // English uses default keys
    );

    private String t(String key, String lang) {
        if ("en".equalsIgnoreCase(lang)) return key;
        Map<String, String> frMap = translations.getOrDefault(lang, Map.of());
        return frMap.getOrDefault(key, key);
    }

    public String generateFormReport(List<Form> forms, String title) {
        return generateFormReport(forms, title, "fr");
    }

    public String generateFormReport(List<Form> forms, String title, String lang) {
        try {
            Path reportsPath = Paths.get(reportsDir);
            if (!Files.exists(reportsPath)) {
                Files.createDirectories(reportsPath);
            }

            String filename = UUID.randomUUID() + "_report.xlsx";
            Path filePath = reportsPath.resolve(filename);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet(t("Forms Report", lang));

            // Title style
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);

            // Generated at row
            Row metaRow = sheet.createRow(1);
            metaRow.createCell(0).setCellValue(t("Generated", lang) + ": " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            // Empty row
            sheet.createRow(2);

            // Header row
            Row headerRow = sheet.createRow(3);
            String[] headers = {
                    t("Form ID", lang),
                    t("Type", lang),
                    t("Status", lang),
                    t("Uploaded By", lang),
                    t("Uploaded At", lang),
                    t("Confirmed At", lang)
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 4;
            for (Form form : forms) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(form.getId().toString());
                row.createCell(1).setCellValue(t(form.getFormType().name(), lang));
                row.createCell(2).setCellValue(t(form.getFormStatus().name(), lang));
                row.createCell(3).setCellValue(form.getUploadedBy().getFullName());
                row.createCell(4).setCellValue(form.getUploadedAt()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                row.createCell(5).setCellValue(form.getConfirmedAt() != null ?
                        form.getConfirmedAt()
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-");
            }

            // Summary row
            Row summaryRow = sheet.createRow(rowNum + 1);
            summaryRow.createCell(0).setCellValue(t("Total forms", lang) + ": " + forms.size());

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write file
            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                workbook.write(fos);
            }
            workbook.close();

            log.info("Excel report generated: {}", filename);
            return filePath.toString();

        } catch (Exception e) {
            log.error("Excel generation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    public String generateDetailedFormReport(
            List<Form> forms,
            Map<UUID, List<FormField>> fieldsByForm,
            String title) {
        return generateDetailedFormReport(forms, fieldsByForm, title, "fr");
    }

    public String generateDetailedFormReport(
            List<Form> forms,
            Map<UUID, List<FormField>> fieldsByForm,
            String title,
            String lang) {
        try {
            Path reportsPath = Paths.get(reportsDir);
            if (!Files.exists(reportsPath)) {
                Files.createDirectories(reportsPath);
            }

            String filename = UUID.randomUUID() + "_export.xlsx";
            Path filePath = reportsPath.resolve(filename);

            Workbook workbook = new XSSFWorkbook();

            // Title style
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group forms by type
            Map<FormType, List<Form>> formsByType = forms.stream()
                    .collect(java.util.stream.Collectors.groupingBy(Form::getFormType));

            for (Map.Entry<FormType, List<Form>> entry : formsByType.entrySet()) {
                FormType type = entry.getKey();
                List<Form> typeForms = entry.getValue();

                Sheet sheet = workbook.createSheet(t(type.name(), lang));

                // Title row
                Row titleRow = sheet.createRow(0);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue(title + " — " + t(type.name(), lang));
                titleCell.setCellStyle(titleStyle);

                // Meta row
                Row metaRow = sheet.createRow(1);
                metaRow.createCell(0).setCellValue(
                        t("Generated", lang) + ": " + LocalDateTime.now()
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                metaRow.createCell(2).setCellValue(
                        t("Total forms", lang) + ": " + typeForms.size() + " " + t("forms", lang));

                sheet.createRow(2); // empty

                // Collect all unique field names for this form type
                Set<String> allFieldNames = new LinkedHashSet<>();
                for (Form form : typeForms) {
                    List<FormField> fields = fieldsByForm.getOrDefault(
                            form.getId(), List.of());
                    fields.forEach(f -> allFieldNames.add(f.getFieldName()));
                }

                // Header row
                Row headerRow = sheet.createRow(3);
                List<String> baseHeaders = List.of(
                        t("Form ID", lang),
                        t("Status", lang),
                        t("Uploaded By", lang),
                        t("Uploaded At", lang),
                        t("Confirmed By", lang));
                List<String> allHeaders = new ArrayList<>(baseHeaders);
                allHeaders.addAll(allFieldNames);

                for (int i = 0; i < allHeaders.size(); i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(allHeaders.get(i));
                    cell.setCellStyle(headerStyle);
                }

                // Data rows
                int rowNum = 4;
                for (Form form : typeForms) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(form.getId().toString());
                    row.createCell(1).setCellValue(t(form.getFormStatus().name(), lang));
                    row.createCell(2).setCellValue(
                            form.getUploadedBy().getFullName());
                    row.createCell(3).setCellValue(
                            form.getUploadedAt().format(
                                    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                    row.createCell(4).setCellValue(
                            form.getConfirmedBy() != null
                                    ? form.getConfirmedBy().getFullName() : "—");

                    // Field values
                    Map<String, String> fieldMap = new HashMap<>();
                    fieldsByForm.getOrDefault(form.getId(), List.of())
                            .forEach(f -> fieldMap.put(
                                    f.getFieldName(),
                                    f.getConfirmedValue() != null
                                            ? f.getConfirmedValue()
                                            : f.getExtractedValue()));

                    int colIdx = 5;
                    for (String fieldName : allFieldNames) {
                        row.createCell(colIdx++).setCellValue(
                                fieldMap.getOrDefault(fieldName, ""));
                    }
                }

                // Auto-size columns
                for (int i = 0; i < allHeaders.size(); i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                workbook.write(fos);
            }
            workbook.close();

            log.info("Detailed Excel export generated: {}", filename);
            return filePath.toString();

        } catch (Exception e) {
            log.error("Excel export failed: {}", e.getMessage());
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }
}