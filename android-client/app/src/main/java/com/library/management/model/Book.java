package com.library.management.model;

import com.google.gson.annotations.SerializedName;

public class Book {
    @SerializedName("id")
    private int id;
    
    @SerializedName("isbn")
    private String isbn;
    
    @SerializedName("title")
    private String title;
    
    @SerializedName("author")
    private String author;
    
    @SerializedName("publisher")
    private String publisher;
    
    @SerializedName("publish_date")
    private String publishDate;
    
    @SerializedName("category_id")
    private int categoryId;
    
    @SerializedName("cover_url")
    private String coverUrl;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("room")
    private String room;
    
    @SerializedName("shelf")
    private String shelf;
    
    @SerializedName("row")
    private int row;
    
    @SerializedName("column")
    private int column;
    
    @SerializedName("number")
    private int number;
    
    @SerializedName("status")
    private String status;
    
    @SerializedName("created_at")
    private String createdAt;
    
    @SerializedName("updated_at")
    private String updatedAt;
    
    private Borrow currentBorrow; // 当前借阅信息（如果已借出）
    
    // 构造函数
    public Book() {}
    
    public Book(String isbn, String title, String author, String publisher, 
                String publishDate, int categoryId, String room, String shelf, 
                int row, int column, int number) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.publishDate = publishDate;
        this.categoryId = categoryId;
        this.room = room;
        this.shelf = shelf;
        this.row = row;
        this.column = column;
        this.number = number;
        this.status = "available";
    }
    
    // Getter和Setter方法
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    
    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }
    
    public String getPublishDate() { return publishDate; }
    public void setPublishDate(String publishDate) { this.publishDate = publishDate; }
    
    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }
    
    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
    
    public String getShelf() { return shelf; }
    public void setShelf(String shelf) { this.shelf = shelf; }
    
    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }
    
    public int getColumn() { return column; }
    public void setColumn(int column) { this.column = column; }
    
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    
    public Borrow getCurrentBorrow() { return currentBorrow; }
    public void setCurrentBorrow(Borrow currentBorrow) { this.currentBorrow = currentBorrow; }
    
    // 辅助方法
    public String getLocation() {
        return room + "-" + shelf + "-" + row + "-" + column + "-" + number;
    }
    
    public boolean isAvailable() {
        return "available".equals(status);
    }
    
    public boolean isBorrowed() {
        return "borrowed".equals(status);
    }
    
    @Override
    public String toString() {
        return "Book{" +
                "id=" + id +
                ", isbn='" + isbn + '\'' +
                ", title='" + title + '\'' +
                ", author='" + author + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}