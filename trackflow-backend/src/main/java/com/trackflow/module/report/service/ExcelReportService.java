package com.trackflow.module.report.service;

import com.trackflow.module.form.entity.Form;
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
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelReportService {

    @Value("${app.storage.reports-dir}")
    private String reportsDir;

    public String generateFormReport(List<Form> forms, String title) {
        try {
            Path reportsPath = Paths.get(reportsDir);
            if (!Files.exists(reportsPath)) {
                Files.createDirectories(reportsPath);
            }

            String filename = UUID.randomUUID() + "_report.xlsx";
            Path filePath = reportsPath.resolve(filename);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Forms Report");

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
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);

            // Generated at row
            Row metaRow = sheet.createRow(1);
            metaRow.createCell(0).setCellValue("Generated: " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            // Empty row
            sheet.createRow(2);

            // Header row
            Row headerRow = sheet.createRow(3);
            String[] headers = {"Form ID", "Type", "Status",
                    "Uploaded By", "Uploaded At", "Confirmed At"};
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 4;
            for (Form form : forms) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(form.getId().toString());
                row.createCell(1).setCellValue(form.getFormType().name());
                row.createCell(2).setCellValue(form.getFormStatus().name());
                row.createCell(3).setCellValue(form.getUploadedBy().getFullName());
                row.createCell(4).setCellValue(form.getUploadedAt()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                row.createCell(5).setCellValue(form.getConfirmedAt() != null ?
                        form.getConfirmedAt()
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "-");
            }

            // Summary row
            Row summaryRow = sheet.createRow(rowNum + 1);
            summaryRow.createCell(0).setCellValue("Total forms: " + forms.size());

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
}
