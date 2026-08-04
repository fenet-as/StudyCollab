package com.studycollab.dto.files;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private Long parentId; // Optional parent if creating a subfolder
}