package com.trackflow.module.report.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.trackflow.module.form.entity.Form;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfReportService {

    @Value("${app.storage.reports-dir}")
    private String reportsDir;

    public String generateFormReport(List<Form> forms, String title) {
        try {
            Path reportsPath = Paths.get(reportsDir);
            if (!Files.exists(reportsPath)) {
                Files.createDirectories(reportsPath);
            }

            String filename = UUID.randomUUID() + "_report.pdf";
            Path filePath = reportsPath.resolve(filename);

            PdfWriter writer = new PdfWriter(filePath.toString());
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Title
            document.add(new Paragraph(title)
                    .setFontSize(18)
                    .setBold()
                    .setMarginBottom(20));

            // Metadata
            document.add(new Paragraph("Generated: " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .setFontSize(10)
                    .setMarginBottom(20));

            // Table
            Table table = new Table(UnitValue.createPercentArray(
                    new float[]{15, 20, 15, 15, 20, 15}))
                    .useAllAvailableWidth();

            // Headers
            Stream.of("Form ID", "Type", "Status", "Uploaded By",
                            "Uploaded At", "Confirmed At")
                    .forEach(header -> table.addHeaderCell(
                            new Cell().add(new Paragraph(header).setBold())));

            // Rows
            for (Form form : forms) {
                table.addCell(form.getId().toString().substring(0, 8) + "...");
                table.addCell(form.getFormType().name());
                table.addCell(form.getFormStatus().name());
                table.addCell(form.getUploadedBy().getFullName());
                table.addCell(form.getUploadedAt()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                table.addCell(form.getConfirmedAt() != null ?
                        form.getConfirmedAt()
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-");
            }

            document.add(table);

            // Summary
            document.add(new Paragraph("\nTotal forms: " + forms.size())
                    .setFontSize(12)
                    .setMarginTop(20));

            document.close();

            log.info("PDF report generated: {}", filename);
            return filePath.toString();

        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }
}
