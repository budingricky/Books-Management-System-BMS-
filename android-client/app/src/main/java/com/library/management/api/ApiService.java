package com.library.management.api;

import com.library.management.model.*;
import retrofit2.Call;
import retrofit2.http.*;
import java.util.List;

public interface ApiService {
    
    // 图书相关API
    @GET("api/books")
    Call<ApiResponse<List<Book>>> getBooks(
        @Query("page") Integer page,
        @Query("limit") Integer limit,
        @Query("search") String search,
        @Query("category") String category,
        @Query("status") String status
    );
    
    @GET("api/books/{id}")
    Call<ApiResponse<Book>> getBook(@Path("id") int id);
    
    @POST("api/books")
    Call<ApiResponse<Book>> createBook(@Body Book book);
    
    @PUT("api/books/{id}")
    Call<ApiResponse<Book>> updateBook(@Path("id") int id, @Body Book book);
    
    @DELETE("api/books/{id}")
    Call<ApiResponse<Void>> deleteBook(@Path("id") int id);
    
    @GET("api/books/isbn/{isbn}")
    Call<ApiResponse<Book>> getBookByIsbn(@Path("isbn") String isbn);
    
    // 分类相关API
    @GET("api/categories")
    Call<ApiResponse<List<Category>>> getCategories();
    
    @GET("api/categories/{id}")
    Call<ApiResponse<Category>> getCategory(@Path("id") Long id);
    
    @POST("api/categories")
    Call<ApiResponse<Category>> createCategory(@Body Category category);
    
    @PUT("api/categories/{id}")
    Call<ApiResponse<Category>> updateCategory(@Path("id") Long id, @Body Category category);
    
    @DELETE("api/categories/{id}")
    Call<ApiResponse<Void>> deleteCategory(@Path("id") Long id);
    
    // 借阅相关API
    @GET("api/borrows")
    Call<ApiResponse<List<Borrow>>> getBorrows(
        @Query("page") Integer page,
        @Query("limit") Integer limit,
        @Query("status") String status,
        @Query("borrower") String borrower
    );
    
    @GET("api/borrows/{id}")
    Call<ApiResponse<Borrow>> getBorrow(@Path("id") int id);
    
    @POST("api/borrows")
    Call<ApiResponse<Borrow>> createBorrow(@Body BorrowRequest borrowRequest);
    
    @PUT("api/borrows/{id}/return")
    Call<ApiResponse<Borrow>> returnBook(@Path("id") int id);
    
    @DELETE("api/borrows/{id}")
    Call<ApiResponse<Void>> deleteBorrow(@Path("id") int id);
    
    // 统计相关API
    @GET("api/statistics")
    Call<ApiResponse<Statistics>> getStatistics();
    
    @GET("api/statistics/books")
    Call<ApiResponse<Statistics>> getBookStatistics();
    
    @GET("api/statistics/borrows")
    Call<ApiResponse<Statistics>> getBorrowStatistics();
    
    // ISBN信息查询API
    @GET("api/isbn/{isbn}")
    Call<ApiResponse<Book>> getIsbnInfo(@Path("isbn") String isbn);
    
    // 借阅请求数据类
    class BorrowRequest {
        private int bookId;
        private String borrower;
        private String dueDate;
        
        public BorrowRequest(int bookId, String borrower, String dueDate) {
            this.bookId = bookId;
            this.borrower = borrower;
            this.dueDate = dueDate;
        }
        
        // Getters
        public int getBookId() { return bookId; }
        public String getBorrower() { return borrower; }
        public String getDueDate() { return dueDate; }
        
        // Setters
        public void setBookId(int bookId) { this.bookId = bookId; }
        public void setBorrower(String borrower) { this.borrower = borrower; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    }
}