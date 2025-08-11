package com.library.management.api;

import com.library.management.model.Book;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface LibraryApiService {
    
    // Books endpoints
    @GET("books")
    Call<List<Book>> getAllBooks();
    
    @GET("books/{id}")
    Call<Book> getBookById(@Path("id") int id);
    
    @GET("books/search")
    Call<List<Book>> searchBooks(@Query("q") String query);
    
    @GET("books/category/{category}")
    Call<List<Book>> getBooksByCategory(@Path("category") String category);
    
    @POST("books")
    Call<Book> createBook(@Body Book book);
    
    @PUT("books/{id}")
    Call<Book> updateBook(@Path("id") int id, @Body Book book);
    
    @DELETE("books/{id}")
    Call<Void> deleteBook(@Path("id") int id);
    
    // Categories endpoints
    @GET("categories")
    Call<List<String>> getAllCategories();
    
    // Statistics endpoints
    @GET("statistics")
    Call<Object> getStatistics();
    
    // Borrow endpoints
    @POST("books/{id}/borrow")
    Call<Void> borrowBook(@Path("id") int bookId);
    
    @POST("books/{id}/return")
    Call<Void> returnBook(@Path("id") int bookId);
    
    @GET("borrows")
    Call<List<Object>> getAllBorrows();
}