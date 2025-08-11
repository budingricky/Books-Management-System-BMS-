package com.library.management.ui.books;

import android.app.DatePickerDialog;
import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.DialogFragment;
import com.library.management.R;
import com.library.management.model.Book;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class BorrowDialogFragment extends DialogFragment {
    
    private static final String ARG_BOOK = "book";
    
    private Book book;
    private EditText etBorrower;
    private TextView tvDueDate;
    private Button btnSelectDate;
    private Button btnConfirm;
    private Button btnCancel;
    
    private String selectedDueDate;
    private OnBorrowListener borrowListener;
    
    public interface OnBorrowListener {
        void onBorrow(int bookId, String borrower, String dueDate);
    }
    
    public static BorrowDialogFragment newInstance(Book book) {
        BorrowDialogFragment fragment = new BorrowDialogFragment();
        Bundle args = new Bundle();
        args.putSerializable(ARG_BOOK, book);
        fragment.setArguments(args);
        return fragment;
    }
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            book = (Book) getArguments().getSerializable(ARG_BOOK);
        }
    }
    
    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireActivity());
        LayoutInflater inflater = requireActivity().getLayoutInflater();
        View view = inflater.inflate(R.layout.dialog_borrow_book, null);
        
        initViews(view);
        setupViews();
        setupClickListeners();
        
        builder.setView(view)
                .setTitle("借阅图书")
                .setCancelable(true);
        
        return builder.create();
    }
    
    private void initViews(View view) {
        etBorrower = view.findViewById(R.id.et_borrower);
        tvDueDate = view.findViewById(R.id.tv_due_date);
        btnSelectDate = view.findViewById(R.id.btn_select_date);
        btnConfirm = view.findViewById(R.id.btn_confirm);
        btnCancel = view.findViewById(R.id.btn_cancel);
    }
    
    private void setupViews() {
        if (book != null) {
            TextView tvBookTitle = getView().findViewById(R.id.tv_book_title);
            if (tvBookTitle != null) {
                tvBookTitle.setText(book.getTitle());
            }
        }
        
        // 设置默认归还日期（30天后）
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, 30);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        selectedDueDate = sdf.format(calendar.getTime());
        tvDueDate.setText(selectedDueDate);
    }
    
    private void setupClickListeners() {
        btnSelectDate.setOnClickListener(v -> showDatePicker());
        
        btnConfirm.setOnClickListener(v -> {
            String borrower = etBorrower.getText().toString().trim();
            if (borrower.isEmpty()) {
                etBorrower.setError("请输入借阅人姓名");
                return;
            }
            
            if (selectedDueDate == null || selectedDueDate.isEmpty()) {
                tvDueDate.setError("请选择归还日期");
                return;
            }
            
            if (borrowListener != null && book != null) {
                borrowListener.onBorrow(book.getId(), borrower, selectedDueDate);
            }
            dismiss();
        });
        
        btnCancel.setOnClickListener(v -> dismiss());
    }
    
    private void showDatePicker() {
        Calendar calendar = Calendar.getInstance();
        
        DatePickerDialog datePickerDialog = new DatePickerDialog(
                requireContext(),
                (view, year, month, dayOfMonth) -> {
                    Calendar selectedDate = Calendar.getInstance();
                    selectedDate.set(year, month, dayOfMonth);
                    
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                    selectedDueDate = sdf.format(selectedDate.getTime());
                    tvDueDate.setText(selectedDueDate);
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
        );
        
        // 设置最小日期为今天
        datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis());
        datePickerDialog.show();
    }
    
    public void setOnBorrowListener(OnBorrowListener listener) {
        this.borrowListener = listener;
    }
}