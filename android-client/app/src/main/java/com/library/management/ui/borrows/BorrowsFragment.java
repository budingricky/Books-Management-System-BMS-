package com.library.management.ui.borrows;

import android.app.AlertDialog;
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

import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Borrow;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BorrowsFragment extends Fragment implements BorrowAdapter.OnBorrowClickListener {
    private RecyclerView recyclerView;
    private BorrowAdapter adapter;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ApiService apiService;
    private List<Borrow> borrows;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_borrows, container, false);
        
        initViews(view);
        setupRecyclerView();
        setupSwipeRefresh();
        
        apiService = ApiClient.getApiService();
        borrows = new ArrayList<>();
        
        loadBorrows();
        
        return view;
    }

    private void initViews(View view) {
        recyclerView = view.findViewById(R.id.recycler_view);
        swipeRefreshLayout = view.findViewById(R.id.swipe_refresh);
    }

    private void setupRecyclerView() {
        adapter = new BorrowAdapter(borrows, this);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        recyclerView.setAdapter(adapter);
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener(this::loadBorrows);
    }

    private void loadBorrows() {
        swipeRefreshLayout.setRefreshing(true);
        
        apiService.getBorrows(null, null, null, null).enqueue(new Callback<ApiResponse<List<Borrow>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Borrow>>> call, Response<ApiResponse<List<Borrow>>> response) {
                swipeRefreshLayout.setRefreshing(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Borrow>> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        borrows.clear();
                        borrows.addAll(apiResponse.getData());
                        adapter.notifyDataSetChanged();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("加载借阅记录失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Borrow>>> call, Throwable t) {
                swipeRefreshLayout.setRefreshing(false);
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    @Override
    public void onBorrowClick(Borrow borrow) {
        // 显示借阅详情
        showBorrowDetails(borrow);
    }

    @Override
    public void onReturnClick(Borrow borrow) {
        // 确认归还
        new AlertDialog.Builder(getContext())
                .setTitle("归还图书")
                .setMessage("确定要归还图书 \"" + borrow.getBook().getTitle() + "\" 吗？")
                .setPositiveButton("归还", (dialog, which) -> returnBook(borrow))
                .setNegativeButton("取消", null)
                .show();
    }

    @Override
    public void onDeleteClick(Borrow borrow) {
        // 确认删除借阅记录
        new AlertDialog.Builder(getContext())
                .setTitle("删除借阅记录")
                .setMessage("确定要删除这条借阅记录吗？")
                .setPositiveButton("删除", (dialog, which) -> deleteBorrow(borrow))
                .setNegativeButton("取消", null)
                .show();
    }

    private void showBorrowDetails(Borrow borrow) {
        AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
        builder.setTitle("借阅详情");
        
        StringBuilder details = new StringBuilder();
        details.append("图书: ").append(borrow.getBook().getTitle()).append("\n");
        details.append("作者: ").append(borrow.getBook().getAuthor()).append("\n");
        details.append("借阅人: ").append(borrow.getBorrower()).append("\n");
        details.append("借阅日期: ").append(borrow.getBorrowDate()).append("\n");
        details.append("应还日期: ").append(borrow.getDueDate()).append("\n");
        
        if (borrow.getReturnDate() != null) {
            details.append("归还日期: ").append(borrow.getReturnDate()).append("\n");
            details.append("状态: 已归还");
        } else {
            details.append("状态: 借阅中");
            
            // 检查是否逾期
            // 这里可以添加逾期检查逻辑
        }
        
        builder.setMessage(details.toString());
        builder.setPositiveButton("确定", null);
        builder.show();
    }

    private void returnBook(Borrow borrow) {
        apiService.returnBook(borrow.getId()).enqueue(new Callback<ApiResponse<Borrow>>() {
            @Override
            public void onResponse(Call<ApiResponse<Borrow>> call, Response<ApiResponse<Borrow>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Borrow> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "图书归还成功", Toast.LENGTH_SHORT).show();
                        loadBorrows();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("归还图书失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Borrow>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void deleteBorrow(Borrow borrow) {
        apiService.deleteBorrow(borrow.getId()).enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "借阅记录删除成功", Toast.LENGTH_SHORT).show();
                        loadBorrows();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("删除借阅记录失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void showError(String message) {
        Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
    }
}