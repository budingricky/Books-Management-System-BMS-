package com.library.management.model;

import com.google.gson.annotations.SerializedName;

public class Borrow {
    @SerializedName("id")
    private int id;
    
    @SerializedName("book_id")
    private int bookId;
    
    @SerializedName("borrower")
    private String borrower;
    
    @SerializedName("borrow_date")
    private String borrowDate;
    
    @SerializedName("due_date")
    private String dueDate;
    
    @SerializedName("return_date")
    private String returnDate;
    
    @SerializedName("status")
    private String status;
    
    @SerializedName("created_at")
    private String createdAt;
    
    // 关联的图书信息（用于显示）
    @SerializedName("book")
    private Book book;
    
    // 构造函数
    public Borrow() {}
    
    public Borrow(int bookId, String borrower, String dueDate) {
        this.bookId = bookId;
        this.borrower = borrower;
        this.dueDate = dueDate;
        this.status = "borrowed";
    }
    
    // Getter和Setter方法
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getBookId() { return bookId; }
    public void setBookId(int bookId) { this.bookId = bookId; }
    
    public String getBorrower() { return borrower; }
    public void setBorrower(String borrower) { this.borrower = borrower; }
    
    public String getBorrowDate() { return borrowDate; }
    public void setBorrowDate(String borrowDate) { this.borrowDate = borrowDate; }
    
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    
    public String getReturnDate() { return returnDate; }
    public void setReturnDate(String returnDate) { this.returnDate = returnDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    
    // 辅助方法
    public boolean isBorrowed() {
        return "borrowed".equals(status);
    }
    
    public boolean isReturned() {
        return "returned".equals(status);
    }
    
    public boolean isOverdue() {
        if (!isBorrowed() || dueDate == null) {
            return false;
        }
        // 简单的日期比较，实际应用中应该使用更精确的日期处理
        try {
            long dueDateMillis = java.sql.Timestamp.valueOf(dueDate.replace("T", " ").replace("Z", "")).getTime();
            return System.currentTimeMillis() > dueDateMillis;
        } catch (Exception e) {
            return false;
        }
    }
    
    @Override
    public String toString() {
        return "Borrow{" +
                "id=" + id +
                ", bookId=" + bookId +
                ", borrower='" + borrower + '\'' +
                ", status='" + status + '\'' +
                ", dueDate='" + dueDate + '\'' +
                '}';
    }
}