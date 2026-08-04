package com.studycollab.dto.files;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.format.DateTimeFormatter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileResponse {
    private Long id;
    private String name;
    private String size;
    private String type;
    private Long categoryId;
    private String uploader;
    private String date; // Formatted date: "dd/MM/yyyy"
}