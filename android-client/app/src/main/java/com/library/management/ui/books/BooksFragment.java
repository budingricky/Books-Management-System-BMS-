package com.library.management.ui.books;

import android.content.Intent;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Book;
import com.library.management.ui.books.adapter.BookAdapter;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;
import static android.app.Activity.RESULT_OK;

public class BooksFragment extends Fragment implements BookAdapter.OnBookClickListener {
    
    private RecyclerView recyclerView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private FloatingActionButton fabAddBook;
    private BookAdapter bookAdapter;
    private ApiClient apiClient;
    private List<Book> bookList;
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        apiClient = ApiClient.getInstance(requireContext());
        bookList = new ArrayList<>();
    }
    
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_books, container, false);
        
        initViews(root);
        setupRecyclerView();
        setupSwipeRefresh();
        setupFab();
        loadBooks();
        
        return root;
    }
    
    private void initViews(View root) {
        recyclerView = root.findViewById(R.id.recycler_view_books);
        swipeRefreshLayout = root.findViewById(R.id.swipe_refresh_layout);
        fabAddBook = root.findViewById(R.id.fab_add_book);
    }
    
    private void setupRecyclerView() {
        bookAdapter = new BookAdapter(bookList, this);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        recyclerView.setAdapter(bookAdapter);
    }
    
    private void setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener(this::loadBooks);
        swipeRefreshLayout.setColorSchemeResources(
                R.color.design_default_color_primary,
                R.color.design_default_color_primary_dark
        );
    }
    
    private void setupFab() {
        fabAddBook.setOnClickListener(v -> {
            // 导航到添加图书页面
            Intent intent = new Intent(getActivity(), AddBookActivity.class);
            startActivityForResult(intent, 1001);
        });
    }
    
    private void loadBooks() {
        swipeRefreshLayout.setRefreshing(true);
        
        apiClient.getApiService().getBooks(null, null, null, null, null)
                .enqueue(new Callback<ApiResponse<List<Book>>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<List<Book>>> call, 
                                         Response<ApiResponse<List<Book>>> response) {
                        swipeRefreshLayout.setRefreshing(false);
                        
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                            List<Book> books = response.body().getData();
                            updateBookList(books);
                        } else {
                            showError("获取图书列表失败");
                        }
                    }
                    
                    @Override
                    public void onFailure(Call<ApiResponse<List<Book>>> call, Throwable t) {
                        swipeRefreshLayout.setRefreshing(false);
                        showError("网络连接失败: " + t.getMessage());
                    }
                });
    }
    
    private void updateBookList(List<Book> books) {
        if (getActivity() == null) return;
        
        getActivity().runOnUiThread(() -> {
            bookList.clear();
            if (books != null) {
                bookList.addAll(books);
            }
            bookAdapter.notifyDataSetChanged();
        });
    }
    
    private void showError(String message) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> 
                Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show()
            );
        }
    }
    
    @Override
    public void onBookClick(Book book) {
        Intent intent = new Intent(getActivity(), BookDetailActivity.class);
        intent.putExtra(BookDetailActivity.EXTRA_BOOK, book);
        startActivityForResult(intent, 1002);
    }
    
    @Override
    public void onBorrowClick(Book book) {
        if ("available".equals(book.getStatus())) {
            showBorrowDialog(book);
        } else {
            Toast.makeText(getContext(), "该图书当前不可借阅", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void showBorrowDialog(Book book) {
        BorrowDialogFragment dialog = BorrowDialogFragment.newInstance(book);
        dialog.setOnBorrowListener(this::borrowBook);
        dialog.show(getParentFragmentManager(), "BorrowDialog");
    }
    
    private void borrowBook(int bookId, String borrower, String dueDate) {
        ApiService apiService = ApiClient.getInstance().getApiService();
        ApiService.BorrowRequest request = new ApiService.BorrowRequest(bookId, borrower, dueDate);
        
        Call<ApiResponse<Void>> call = apiService.createBorrow(request);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "借阅成功", Toast.LENGTH_SHORT).show();
                        loadBooks(); // 刷新图书列表
                    } else {
                        Toast.makeText(getContext(), "借阅失败: " + apiResponse.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(getContext(), "借阅失败", Toast.LENGTH_SHORT).show();
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Toast.makeText(getContext(), "网络错误: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // 页面恢复时刷新数据
        loadBooks();
    }
    
    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if ((requestCode == 1001 || requestCode == 1002) && resultCode == RESULT_OK) {
            // 刷新图书列表
            loadBooks();
        }
    }
}