package com.library.management.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Statistics {
    @SerializedName("totalBooks")
    private int totalBooks;
    
    @SerializedName("borrowedBooks")
    private int borrowedBooks;
    
    @SerializedName("availableBooks")
    private int availableBooks;
    
    @SerializedName("categories")
    private List<CategoryStat> categories;
    
    @SerializedName("recentBorrows")
    private List<Borrow> recentBorrows;
    
    // 构造函数
    public Statistics() {}
    
    // Getter和Setter方法
    public int getTotalBooks() { return totalBooks; }
    public void setTotalBooks(int totalBooks) { this.totalBooks = totalBooks; }
    
    public int getBorrowedBooks() { return borrowedBooks; }
    public void setBorrowedBooks(int borrowedBooks) { this.borrowedBooks = borrowedBooks; }
    
    public int getAvailableBooks() { return availableBooks; }
    public void setAvailableBooks(int availableBooks) { this.availableBooks = availableBooks; }
    
    public List<CategoryStat> getCategories() { return categories; }
    public void setCategories(List<CategoryStat> categories) { this.categories = categories; }
    
    public List<Borrow> getRecentBorrows() { return recentBorrows; }
    public void setRecentBorrows(List<Borrow> recentBorrows) { this.recentBorrows = recentBorrows; }
    
    // 辅助方法
    public double getBorrowRate() {
        if (totalBooks == 0) return 0.0;
        return (double) borrowedBooks / totalBooks * 100;
    }
    
    public double getAvailableRate() {
        if (totalBooks == 0) return 0.0;
        return (double) availableBooks / totalBooks * 100;
    }
    
    @Override
    public String toString() {
        return "Statistics{" +
                "totalBooks=" + totalBooks +
                ", borrowedBooks=" + borrowedBooks +
                ", availableBooks=" + availableBooks +
                ", borrowRate=" + String.format("%.1f", getBorrowRate()) + "%" +
                '}';
    }
    
    // 分类统计内部类
    public static class CategoryStat {
        @SerializedName("category")
        private String category;
        
        @SerializedName("count")
        private int count;
        
        @SerializedName("percentage")
        private double percentage;
        
        public CategoryStat() {}
        
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
        
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        
        @Override
        public String toString() {
            return "CategoryStat{" +
                    "category='" + category + '\'' +
                    ", count=" + count +
                    ", percentage=" + String.format("%.1f", percentage) + "%" +
                    '}';
        }
    }
}