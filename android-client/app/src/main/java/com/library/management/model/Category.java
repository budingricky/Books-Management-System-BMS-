package com.library.management.model;

import com.google.gson.annotations.SerializedName;

public class Category {
    @SerializedName("id")
    private Long id;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("code")
    private String code;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("parent_id")
    private Integer parentId;
    
    @SerializedName("level")
    private int level;
    
    @SerializedName("book_count")
    private Integer bookCount;
    
    @SerializedName("created_at")
    private String createdAt;
    
    // 构造函数
    public Category() {}
    
    public Category(String name, String code, Integer parentId, int level) {
        this.name = name;
        this.code = code;
        this.parentId = parentId;
        this.level = level;
    }
    
    // Getter和Setter方法
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Integer getParentId() { return parentId; }
    public void setParentId(Integer parentId) { this.parentId = parentId; }
    
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    
    public Integer getBookCount() { return bookCount; }
    public void setBookCount(Integer bookCount) { this.bookCount = bookCount; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    
    // 辅助方法
    public boolean isTopLevel() {
        return parentId == null || level == 1;
    }
    
    @Override
    public String toString() {
        return "Category{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", code='" + code + '\'' +
                ", level=" + level +
                '}';
    }
}