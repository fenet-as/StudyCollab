// backend/src/main/java/com/studycollab/dto/group/GroupUpdateRequest.java
package com.studycollab.dto.group;

public class GroupUpdateRequest {
    private String name;
    private String description;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}