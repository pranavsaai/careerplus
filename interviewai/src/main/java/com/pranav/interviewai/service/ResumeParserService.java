package com.pranav.interviewai.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Service
public class ResumeParserService {

    public String extractText(MultipartFile file) throws Exception {

        String filename = file.getOriginalFilename();

        if (filename == null) {
            throw new RuntimeException("Invalid file");
        }

        if (filename.endsWith(".pdf")) {
            return extractPdfText(file);
        }

        if (filename.endsWith(".docx")) {
            return extractDocxText(file);
        }

        throw new RuntimeException("Unsupported file format");
    }

    private String extractPdfText(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             PDDocument document = PDDocument.load(is)) {

            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
    private String extractDocxText(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
        XWPFDocument doc = new XWPFDocument(is)) {
            StringBuilder text = new StringBuilder();
            doc.getParagraphs().forEach(p ->text.append(p.getText()).append("\n")
        );
        return text.toString();
    }
}
}
