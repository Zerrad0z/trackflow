package com.trackflow.module.form.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.stereotype.Service;

import java.io.File;

@Slf4j
@Service
public class OcrService {

    private final Tesseract tesseract;

    public OcrService() {
        this.tesseract = new Tesseract();
        this.tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata");
        this.tesseract.setLanguage("fra+eng");
        this.tesseract.setPageSegMode(1);
        this.tesseract.setOcrEngineMode(1);
    }

    public String extractText(String filePath) {
        try {
            File file = new File(filePath);
            String text = tesseract.doOCR(file);
            log.info("OCR extracted {} characters", text.length());
            return text;
        } catch (Exception e) {
            log.error("OCR failed: {}", e.getMessage());
            return "";
        }
    }
}