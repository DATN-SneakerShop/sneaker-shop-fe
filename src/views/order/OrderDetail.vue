<template>
  <div class="page-wrapper">
    <div class="order-detail-page">
      <a-page-header
        class="custom-page-header"
        @back="router.push('/orders')"
      >
        <template #title>
          <div class="header-title-wrap">
            <span>{{ detail?.orderCode || 'Chi tiết đơn hàng' }}</span>
            <a-tag
              v-if="detail?.orderStatus"
              :color="orderStatusColor(detail?.orderStatus)"
              class="ml-2"
            >
              {{ orderStatusText(detail?.orderStatus) }}
            </a-tag>
          </div>
        </template>

        <template #subTitle>
          <span class="header-subtitle">Màn hình xử lý nghiệp vụ đơn hàng</span>
        </template>

        <template #extra>
          <a-space wrap class="action-buttons">
            <a-button @click="router.push('/orders')">
              <template #icon><ArrowLeftOutlined /></template>
              Quay lại
            </a-button>

            <a-button
              v-if="canCreateCounterQr"
              type="primary"
              ghost
              @click="openCounterQrModal"
            >
              Tạo QR thanh toán
            </a-button>

            <a-button
              v-if="canMarkPaid"
              class="btn-success"
              @click="quickSetPaymentStatus('PAID')"
            >
              Đã thanh toán
            </a-button>

            <a-button
              v-if="canMarkReadyToShip"
              @click="quickSetShippingStatus('READY_TO_SHIP')"
            >
              Sẵn sàng giao
            </a-button>

            <a-button
              v-if="canMarkShipped"
              type="primary"
              @click="quickShipOrder"
            >
              Đã gửi vận chuyển
            </a-button>

            <a-button
              v-if="canMarkDelivered"
              class="btn-success"
              @click="quickSetShippingStatus('DELIVERED')"
            >
              Giao thành công
            </a-button>

            <a-button
              v-if="canCompleteOrder"
              type="primary"
              ghost
              @click="updateOrderStatusAction('COMPLETED')"
            >
              Hoàn thành đơn
            </a-button>

            <a-button
              v-if="canCancelOrder"
              danger
              @click="openCancelModal"
            >
              Hủy đơn
            </a-button>
          </a-space>
        </template>
      </a-page-header>

      <a-spin :spinning="loading" tip="Đang tải dữ liệu...">
        <a-row :gutter="[24, 24]" class="mt-4">
          <a-col :xs="24" :xl="16">
            <a-space direction="vertical" size="large" style="width: 100%">
              <a-card class="pro-card" :bordered="false">
                <template #title>
                  <div class="card-title"><InfoCircleOutlined /> Thông tin chung</div>
                </template>

                <a-descriptions
                  :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }"
                  bordered
                  size="middle"
                >
                  <a-descriptions-item label="Mã đơn">
                    <b>{{ detail?.orderCode || '-' }}</b>
                  </a-descriptions-item>

                  <a-descriptions-item label="Mã tra cứu">
                    {{ detail?.lookupCode || '-' }}
                  </a-descriptions-item>

                  <a-descriptions-item label="Ngày tạo">
                    {{ formatDate(detail?.createdAt) }}
                  </a-descriptions-item>

                  <a-descriptions-item label="Kênh đơn">
                    <a-tag color="blue">{{ channelText(detail?.channel) }}</a-tag>
                  </a-descriptions-item>

                  <a-descriptions-item label="Trạng thái thanh toán">
                    <a-tag :color="paymentStatusColor(detail?.paymentStatus)">
                      <Badge :status="detail?.paymentStatus === 'PAID' ? 'success' : 'default'" />
                      {{ paymentStatusText(detail?.paymentStatus) }}
                    </a-tag>
                  </a-descriptions-item>

                  <a-descriptions-item label="Trạng thái vận chuyển">
                    <a-tag v-if="detail?.channel === 'OFFLINE'" color="blue">Nhận tại quầy</a-tag>
                    <a-tag v-else :color="shippingStatusColor(detail?.shippingStatus)">
                      {{ shippingStatusText(detail?.shippingStatus) }}
                    </a-tag>
                  </a-descriptions-item>

                  <a-descriptions-item label="Trạng thái trả hàng (luồng cũ)">
                    <a-tag
                      v-if="detail?.returnStatus && detail.returnStatus !== 'NONE'"
                      color="volcano"
                    >
                      {{ returnStatusText(detail?.returnStatus) }}
                    </a-tag>
                    <span v-else>-</span>
                  </a-descriptions-item>

                  <a-descriptions-item label="Thanh toán">
                    <b>{{ paymentMethodText(detail?.paymentMethod) }}</b>
                  </a-descriptions-item>
                </a-descriptions>
              </a-card>

              <a-row :gutter="[24, 24]">
                <a-col :xs="24" :md="detail?.channel === 'ONLINE' ? 12 : 24">
                  <a-card class="pro-card h-100" :bordered="false">
                    <template #title>
                      <div class="card-title"><UserOutlined /> Thông tin khách hàng</div>
                    </template>

                    <a-row :gutter="24">
                      <a-col :xs="24" :md="detail?.channel === 'ONLINE' ? 24 : 12">
                        <div class="info-list">
                          <div class="info-item">
                            <span class="info-label">Phân loại:</span>
                            <span class="info-value">
                              <a-tag :color="detail?.customerId ? 'blue' : 'default'">
                                {{ detail?.customerId ? 'Khách thành viên' : 'Khách vãng lai (Lẻ)' }}
                              </a-tag>
                            </span>
                          </div>

                          <div class="info-item" v-if="detail?.customerId">
                            <span class="info-label">Mã khách:</span>
                            <span class="info-value text-primary fw-600">CUST-{{ detail?.customerId }}</span>
                          </div>

                          <div class="info-item">
                            <span class="info-label">Tên khách:</span>
                            <span class="info-value fw-600">
                              {{
                                displayValidName(detail?.ordererName)
                                  || displayValidName(detail?.receiverName)
                                  || 'Khách mua tại quầy'
                              }}
                            </span>
                          </div>
                        </div>
                      </a-col>

                      <a-col :xs="24" :md="detail?.channel === 'ONLINE' ? 24 : 12">
                        <div class="info-list" :style="detail?.channel === 'ONLINE' ? 'margin-top: 12px' : ''">
                          <div class="info-item">
                            <span class="info-label">SĐT liên hệ:</span>
                            <span class="info-value fw-600">
                              {{
                                displayValidName(detail?.ordererPhone)
                                  || displayValidName(detail?.receiverPhone)
                                  || '---'
                              }}
                            </span>
                          </div>

                          <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">{{ displayValidName(detail?.ordererEmail) || '---' }}</span>
                          </div>

                          <a-divider style="margin: 8px 0" />

                          <div class="info-item">
                            <span class="info-label">Nhân viên tạo:</span>
                            <span class="info-value">{{ detail?.createdById || 'Hệ thống (Tự động)' }}</span>
                          </div>
                        </div>
                      </a-col>
                    </a-row>
                  </a-card>
                </a-col>

                <a-col :xs="24" :md="12" v-if="detail?.channel === 'ONLINE'">
                  <a-card class="pro-card h-100" :bordered="false">
                    <template #title>
                      <div class="card-title"><EnvironmentOutlined /> Địa chỉ giao hàng</div>
                    </template>

                    <div class="info-list">
                      <div class="info-item">
                        <span class="info-label">Người nhận:</span>
                        <span class="info-value fw-600">{{ displayValidName(detail?.receiverName) || '-' }}</span>
                      </div>

                      <div class="info-item">
                        <span class="info-label">SĐT nhận:</span>
                        <span class="info-value">{{ displayValidName(detail?.receiverPhone) || '-' }}</span>
                      </div>

                      <div class="info-item">
                        <span class="info-label">Nhãn địa chỉ:</span>
                        <span class="info-value">
                          <a-tag v-if="detail?.addressLabel">{{ detail?.addressLabel }}</a-tag>
                          <span v-else>-</span>
                        </span>
                      </div>

                      <div class="info-item mt-2">
                        <span class="info-value text-muted">
                          {{ detail?.shippingDetailAddress || '' }}<br />
                          {{
                            [detail?.shippingWard, detail?.shippingDistrict, detail?.shippingProvince]
                              .filter(Boolean)
                              .join(', ') || '-'
                          }}
                        </span>
                      </div>
                    </div>
                  </a-card>
                </a-col>
              </a-row>

              <a-card class="pro-card" :bordered="false">
                <template #title>
                  <div class="card-title"><ShoppingOutlined /> Sản phẩm trong đơn</div>
                </template>

                <a-table
                  :dataSource="detail?.items || []"
                  :columns="itemColumns"
                  rowKey="id"
                  :pagination="false"
                  :scroll="{ x: 800 }"
                  class="custom-table"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'product'">
                      <div class="product-cell">
                        <div class="img-wrap">
                          <img
                            v-if="getOrderItemImage(record)"
                            :src="getOrderItemImage(record)"
                            class="product-thumb"
                            alt=""
                            @error="handleOrderItemImageError"
                          />
                          <div v-else class="img-placeholder"><ShoppingOutlined /></div>
                        </div>

                        <div class="product-info">
                          <div class="product-name">{{ record.productNameSnapshot || '-' }}</div>
                          <div class="product-meta">SKU: {{ record.skuSnapshot || '-' }}</div>
                          <div class="product-meta">Phân loại: {{ record.colorSnapshot || '-' }} - {{ record.sizeSnapshot || '-' }}</div>
                        </div>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'unitPrice'">
                      {{ formatMoney(record.unitPrice) }}
                    </template>

                    <template v-else-if="column.key === 'discount'">
                      <div v-if="record.lineDiscountAmount > 0" class="text-danger">
                        -{{ formatMoney(record.lineDiscountAmount) }}
                      </div>
                      <div
                        v-if="record.promotionDiscountAmount > 0"
                        class="product-meta text-warning"
                      >
                        KM: -{{ formatMoney(record.promotionDiscountAmount) }}
                      </div>
                      <span v-if="!record.lineDiscountAmount && !record.promotionDiscountAmount">-</span>
                    </template>

                    <template v-else-if="column.key === 'lineTotalAmount'">
                      <span class="money-strong">{{ formatMoney(record.lineTotalAmount) }}</span>
                    </template>
                  </template>
                </a-table>
              </a-card>
            </a-space>
          </a-col>

          <a-col :xs="24" :xl="8">
            <a-space direction="vertical" size="large" style="width: 100%">
              <a-card class="pro-card suggestion-card" :bordered="false" v-if="smartSuggestionActions.length">
                <template #title>
                  <div class="card-title"><BulbOutlined /> Gợi ý thao tác tiếp theo</div>
                </template>

                <div class="suggestion-box">
                  <div class="suggestion-head">
                    <strong>{{ suggestionTitle }}</strong>
                    <p>{{ suggestionDescription }}</p>
                  </div>

                  <a-alert
                    v-if="confirmBlockedReason"
                    type="warning"
                    show-icon
                    class="mb-2"
                    :message="confirmBlockedReason"
                  />

                  <a-space direction="vertical" size="middle" style="width: 100%">
                    <a-button
                      v-for="action in smartSuggestionActions"
                      :key="action.key"
                      block
                      :type="action.type || 'default'"
                      :danger="action.danger || false"
                      :ghost="action.ghost || false"
                      class="smart-action-btn"
                      @click="action.handler"
                    >
                      {{ action.label }}
                    </a-button>
                  </a-space>
                </div>
              </a-card>

              <a-card
                v-if="quickShipForm.visible"
                class="pro-card quick-ship-card"
                :bordered="false"
              >
                <template #title>
                  <div class="card-title"><CarOutlined /> Nhập nhanh thông tin gửi vận chuyển</div>
                </template>

                <a-form layout="vertical">
                  <a-form-item label="Đơn vị vận chuyển" required>
                    <a-input
                      v-model:value="quickShipForm.shippingCarrier"
                      placeholder="Ví dụ: Giao Hàng Nhanh, Viettel Post..."
                      size="large"
                    />
                  </a-form-item>

                  <a-form-item label="Mã vận đơn (Tracking Code)" required>
                    <a-input
                      v-model:value="quickShipForm.trackingCode"
                      placeholder="Nhập mã vận đơn"
                      size="large"
                    />
                  </a-form-item>

                  <a-space>
                    <a-button
                      type="primary"
                      :loading="quickShipForm.loading"
                      @click="submitQuickShipForm"
                    >
                      Xác nhận đã gửi vận chuyển
                    </a-button>

                    <a-button @click="closeQuickShipForm">
                      Đóng
                    </a-button>
                  </a-space>
                </a-form>
              </a-card>

              <a-card v-if="hasBusinessActions" class="pro-card bg-highlight" :bordered="false">
                <template #title>
                  <div class="card-title"><ControlOutlined /> Điều khiển nghiệp vụ</div>
                </template>

                <a-space direction="vertical" style="width: 100%" size="middle">





                  <a-button
                    v-if="canShowPaymentFix"
                    block
                    type="default"
                    class="action-btn"
                    @click="openPaymentModal"
                  >
                    Xử lý lỗi thanh toán chuyển khoản
                  </a-button>

                  <a-button
                    v-if="canShowShippingUpdate"
                    block
                    type="default"
                    class="action-btn"
                    @click="openShippingModal"
                  >
                    Cập nhật mã vận đơn / thông tin giao hàng
                  </a-button>

                  <a-button
                    v-if="canShowReturn"
                    block
                    type="default"
                    danger
                    class="action-btn"
                    @click="openReturnModal"
                  >
                    Tạo đơn hoàn trả
                  </a-button>

                </a-space>
              </a-card>

              <a-card class="pro-card summary-card" :bordered="false">
                <template #title>
                  <div class="card-title"><DollarOutlined /> Chi tiết thanh toán</div>
                </template>

                <div class="summary-list">
                  <div class="summary-row">
                    <span>Tạm tính ({{ detail?.items?.length || 0 }} sản phẩm)</span>
                    <span>{{ formatMoney(detail?.subtotalAmount) }}</span>
                  </div>

                  <div class="summary-row text-danger" v-if="detail?.discountAmount > 0">
                    <span>Tổng giảm giá</span>
                    <span>-{{ formatMoney(detail?.discountAmount) }}</span>
                  </div>

                  <div class="summary-row text-warning" v-if="detail?.promotionDiscountAmount > 0">
                    <span>Giảm Promotion</span>
                    <span>-{{ formatMoney(detail?.promotionDiscountAmount) }}</span>
                  </div>

                  <div class="summary-row text-warning" v-if="detail?.voucherDiscountAmount > 0">
                    <span>Giảm Voucher</span>
                    <span>-{{ formatMoney(detail?.voucherDiscountAmount) }}</span>
                  </div>

                  <div class="summary-row" v-if="detail?.shippingFee > 0">
                    <span>Phí vận chuyển</span>
                    <span>{{ formatMoney(detail?.shippingFee) }}</span>
                  </div>

                  <div class="summary-row text-success" v-if="detail?.shippingDiscountAmount > 0">
                    <span>Hỗ trợ phí ship</span>
                    <span>-{{ formatMoney(detail?.shippingDiscountAmount) }}</span>
                  </div>

                  <a-divider style="margin: 12px 0" />

                  <div class="summary-row total-row">
                    <span>Khách phải trả</span>
                    <span class="final-amount">{{ formatMoney(detail?.finalAmount) }}</span>
                  </div>

                  <div v-if="isBankTransfer" class="bank-transfer-box mt-3">
                    <div class="summary-row">
                      <span>Khách đã chuyển</span>
                      <span class="fw-700">{{ formatMoney(receivedAmount) }}</span>
                    </div>

                    <div class="summary-row" v-if="paymentDifference > 0">
                      <span class="text-danger">Còn thiếu</span>
                      <span class="text-danger fw-700">{{ formatMoney(paymentDifference) }}</span>
                    </div>

                    <div class="summary-row" v-else-if="paymentDifference < 0">
                      <span class="text-warning">Chuyển dư</span>
                      <span class="text-warning fw-700">{{ formatMoney(Math.abs(paymentDifference)) }}</span>
                    </div>

                    <div class="summary-row" v-else-if="receivedAmount > 0">
                      <span class="text-success">Đã nhận đủ</span>
                      <span class="text-success fw-700">{{ formatMoney(receivedAmount) }}</span>
                    </div>

                    <div class="transfer-hint" v-if="lastTransferReceivedAt">
                      Ghi nhận lần nhận tiền gần nhất: {{ formatDate(lastTransferReceivedAt) }}
                    </div>
                  </div>

                  <div class="summary-row text-muted mt-2" v-if="detail?.returnedAmount > 0">
                    <span>Đã hoàn tiền</span>
                    <span>{{ formatMoney(detail?.returnedAmount) }}</span>
                  </div>
                </div>
              </a-card>

              <a-card class="pro-card" :bordered="false" v-if="detail?.channel === 'ONLINE'">
                <template #title>
                  <div class="card-title"><CarOutlined /> Thông tin giao hàng</div>
                </template>

                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Đơn vị VC:</span>
                    <span class="info-value fw-600">{{ detail?.shippingCarrier || '-' }}</span>
                  </div>

                  <div class="info-item">
                    <span class="info-label">Mã vận đơn:</span>
                    <span class="info-value text-primary fw-600">{{ detail?.trackingCode || '-' }}</span>
                  </div>

                  <div class="info-item" v-if="detail?.shippedAt">
                    <span class="info-label">Ngày gửi:</span>
                    <span class="info-value">{{ formatDate(detail?.shippedAt) }}</span>
                  </div>

                  <div class="info-item" v-if="detail?.deliveryFailReason">
                    <span class="info-label text-danger">Lý do lỗi:</span>
                    <span class="info-value text-danger">{{ detail?.deliveryFailReason }}</span>
                  </div>
                </div>
              </a-card>

              <a-card class="pro-card" :bordered="false">
                <template #title>
                  <div class="card-title"><FileTextOutlined /> Ghi chú</div>
                </template>

                <div class="note-box">
                  <div class="note-item" v-if="detail?.note">
                    <strong>Ghi chú đơn:</strong>
                    <p>{{ detail.note }}</p>
                  </div>

                  <div class="note-item text-danger" v-if="detail?.cancelReason">
                    <strong>Lý do hủy:</strong>
                    <p>{{ detail.cancelReason }}</p>
                  </div>

                  <div class="note-item text-warning" v-if="detail?.returnNote">
                    <strong>Ghi chú hoàn/trả:</strong>
                    <p>{{ detail.returnNote }}</p>
                  </div>

                  <div
                    v-if="!detail?.note && !detail?.cancelReason && !detail?.returnNote"
                    class="text-muted italic"
                  >
                    Không có ghi chú nào.
                  </div>
                </div>
              </a-card>

              <a-card class="pro-card" :bordered="false">
                <template #title>
                  <div class="card-title"><HistoryOutlined /> Lịch sử đơn hàng</div>
                </template>

                <a-timeline class="custom-timeline">
                  <a-timeline-item v-if="detail?.createdAt" color="blue">
                    Tạo đơn hàng<br /><small class="text-muted">{{ formatDate(detail.createdAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item
                    v-for="(paymentEvent, index) in paymentHistoryEvents"
                    :key="`payment-${index}-${paymentEvent.time || index}`"
                    :color="paymentEvent.kind === 'overpaid' ? 'gold' : paymentEvent.kind === 'underpaid' ? 'orange' : 'green'"
                  >
                    {{ paymentEvent.label }}<br />
                    <small class="text-muted">{{ formatDate(paymentEvent.time) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.updatedAt" color="gray">
                    Cập nhật lần cuối<br /><small class="text-muted">{{ formatDate(detail.updatedAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.shippedAt" color="cyan">
                    Đã giao cho ĐVVC<br /><small class="text-muted">{{ formatDate(detail.shippedAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.deliveredAt" color="green">
                    Giao hàng thành công<br /><small class="text-muted">{{ formatDate(detail.deliveredAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.completedAt" color="green">
                    <template #dot><CheckCircleOutlined style="font-size: 16px" /></template>
                    Hoàn thành đơn<br /><small class="text-muted">{{ formatDate(detail.completedAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.cancelledAt" color="red">
                    Hủy đơn hàng<br /><small class="text-muted">{{ formatDate(detail.cancelledAt) }}</small>
                  </a-timeline-item>

                  <a-timeline-item v-if="detail?.returnedAt" color="orange">
                    Hoàn trả hàng<br /><small class="text-muted">{{ formatDate(detail.returnedAt) }}</small>
                  </a-timeline-item>
                </a-timeline>
              </a-card>
            </a-space>
          </a-col>
        </a-row>
      </a-spin>

      <a-modal
        v-model:open="counterQrModal.open"
        title="QR thanh toán tại quầy"
        width="720px"
        :footer="null"
        centered
      >
        <div class="mt-3">
          <a-alert
            v-if="isBankTransfer && isOfflineOrder"
            type="info"
            show-icon
            message="Khách chuyển khoản tại quầy"
            description="Đưa mã QR cho khách quét. Khi callback xác nhận đủ tiền, đơn sẽ tự chuyển sang hoàn thành."
            class="mb-4"
          />

          <div class="counter-qr-layout">
            <div class="counter-qr-left">
              <div class="qr-box">
                <img
                  v-if="counterQrData.qrImageUrl"
                  :src="counterQrData.qrImageUrl"
                  alt="QR thanh toán"
                  class="qr-image"
                  @error="handleQrImageError"
                />
                <div v-else class="qr-placeholder">Chưa có QR</div>
              </div>
            </div>

            <div class="counter-qr-right">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Mã đơn:</span>
                  <span class="info-value fw-600">{{ detail?.orderCode || '-' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Số tiền:</span>
                  <span class="info-value fw-700 text-danger">{{ formatMoney(payableAmount) }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Ngân hàng:</span>
                  <span class="info-value">{{ counterQrData.bankName || detail?.bankName || '-' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Số TK:</span>
                  <span class="info-value fw-600">{{ counterQrData.bankAccountNo || detail?.bankAccountNo || '-' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Chủ TK:</span>
                  <span class="info-value">{{ counterQrData.accountName || detail?.bankAccountName || '-' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Nội dung CK:</span>
                  <span class="info-value fw-600 text-primary">
                    {{ counterQrData.transferContent || detail?.paymentCode || '-' }}
                  </span>
                </div>

                <div class="info-item" v-if="receivedAmount > 0">
                  <span class="info-label">Đã nhận:</span>
                  <span class="info-value fw-700">{{ formatMoney(receivedAmount) }}</span>
                </div>

                <div class="info-item" v-if="paymentDifference > 0 && receivedAmount > 0">
                  <span class="info-label text-danger">Còn thiếu:</span>
                  <span class="info-value text-danger fw-700">{{ formatMoney(paymentDifference) }}</span>
                </div>

                <div class="info-item" v-if="paymentDifference < 0">
                  <span class="info-label text-warning">Chuyển dư:</span>
                  <span class="info-value text-warning fw-700">{{ formatMoney(Math.abs(paymentDifference)) }}</span>
                </div>
              </div>

              <a-space wrap class="mt-4">
                <a-button @click="refreshQrPaymentStatus" :loading="counterQrModal.checking">
                  Kiểm tra callback
                </a-button>
                <a-button type="primary" @click="reloadCounterQr" :loading="counterQrModal.loading">
                  Tạo lại QR
                </a-button>
              </a-space>
            </div>
          </div>
        </div>
      </a-modal>

      <a-modal
        v-model:open="orderStatusModal.open"
        title="Cập nhật trạng thái đơn hàng"
        ok-text="Lưu thay đổi"
        cancel-text="Hủy"
        :confirmLoading="orderStatusModal.loading"
        centered
        @ok="submitOrderStatusModal"
      >
        <a-form layout="vertical" class="mt-4">
          <a-form-item label="Trạng thái đơn hàng">
            <a-select v-model:value="orderStatusModal.orderStatus" size="large">
              <a-select-option
                v-for="value in orderStatusOptions"
                :key="value"
                :value="value"
              >
                {{ orderStatusText(value) }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-alert
            v-if="isOfflineOrder && orderStatusModal.orderStatus === 'COMPLETED' && detail?.paymentStatus !== 'PAID'"
            type="warning"
            show-icon
            message="Đơn tại quầy nên được đánh dấu đã thanh toán trước khi hoàn thành."
          />

          <a-alert
            v-if="
              isOnlineOrder
              && normalizeCurrentOrderStatus === 'NEW'
              && isBankTransfer
              && detail?.paymentStatus !== 'PAID'
            "
            type="warning"
            show-icon
            class="mt-3"
            message="Đơn online thanh toán chuyển khoản chưa hoàn tất nên chưa thể xác nhận đơn."
          />
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="paymentModal.open"
        title="Cập nhật trạng thái thanh toán"
        ok-text="Lưu thay đổi"
        cancel-text="Hủy"
        :confirmLoading="paymentModal.loading"
        centered
        @ok="submitPaymentModal"
      >
        <a-form layout="vertical" class="mt-4">
          <a-form-item label="Trạng thái thanh toán">
            <a-select v-model:value="paymentModal.paymentStatus" size="large">
              <a-select-option
                v-for="value in paymentFixStatusOptions"
                :key="value"
                :value="value"
              >
                {{ paymentStatusText(value) }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="shippingModal.open"
        title="Cập nhật vận chuyển / Tracking"
        ok-text="Lưu thay đổi"
        cancel-text="Hủy"
        :confirmLoading="shippingModal.loading"
        centered
        @ok="submitShippingModal"
      >
        <a-form layout="vertical" class="mt-4">
          <a-form-item label="Trạng thái vận chuyển">
            <a-select v-model:value="shippingModal.shippingStatus" size="large">
              <a-select-option
                v-for="value in shippingStatusOptions"
                :key="value"
                :value="value"
              >
                {{ shippingStatusText(value) }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Đơn vị vận chuyển">
            <a-input
              v-model:value="shippingModal.shippingCarrier"
              size="large"
              placeholder="VD: Giao Hàng Nhanh, Viettel Post..."
            />
          </a-form-item>

          <a-form-item label="Mã vận đơn (Tracking Code)">
            <a-input
              v-model:value="shippingModal.trackingCode"
              size="large"
              placeholder="Nhập mã vận đơn"
            />
          </a-form-item>

          <a-form-item label="Lý do giao thất bại (nếu có)">
            <a-textarea
              v-model:value="shippingModal.deliveryFailReason"
              :rows="3"
              placeholder="Ghi chú lý do..."
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="cancelModal.open"
        title="Xác nhận hủy đơn hàng"
        ok-text="Xác nhận hủy"
        ok-type="danger"
        cancel-text="Đóng"
        :confirmLoading="cancelModal.loading"
        centered
        @ok="submitCancelModal"
      >
        <a-form layout="vertical" class="mt-4">
          <a-alert
            message="Hành động này không thể hoàn tác!"
            type="warning"
            show-icon
            class="mb-4"
          />
          <a-form-item label="Lý do hủy đơn" required>
            <a-textarea
              v-model:value="cancelModal.reason"
              :rows="3"
              placeholder="Nhập lý do hủy chi tiết..."
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal
        v-model:open="returnModal.open"
        title="Tạo đơn hoàn trả"
        width="960px"
        ok-text="Tạo yêu cầu"
        cancel-text="Đóng"
        :confirmLoading="returnModal.loading"
        centered
        @ok="submitReturnModal"
      >
        <div class="mt-4">
          <a-row :gutter="24">
            <a-col :span="8">
              <a-alert
                type="info"
                show-icon
                message="Trang chi tiết đơn hàng chỉ tạo đơn hoàn trả. Các bước nhận hàng, duyệt hàng hoàn, hoàn tiền và hoàn tất sẽ xử lý tại trang Quản lý đơn hoàn trả."
                class="mb-3"
              />
              <a-form layout="vertical">
                <a-form-item label="Lý do / ghi chú hoàn trả">
                  <a-textarea
                    v-model:value="returnModal.returnNote"
                    :rows="6"
                    placeholder="Nhập lý do khách yêu cầu hoàn trả..."
                  />
                </a-form-item>
              </a-form>
            </a-col>

            <a-col :span="16">
              <div class="fw-600 mb-2">Chi tiết sản phẩm hoàn trả:</div>
              <a-table
                :dataSource="returnModal.items"
                :columns="returnColumns"
                rowKey="orderItemId"
                :pagination="false"
                size="small"
                bordered
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'returnedQuantity'">
                    <a-input-number
                      v-model:value="record.returnedQuantity"
                      :min="0"
                      :max="record.max"
                      style="width: 100%"
                    />
                  </template>
                  <template v-else-if="column.key === 'returnNote'">
                    <a-input v-model:value="record.returnNote" placeholder="Lý do..." />
                  </template>
                </template>
              </a-table>
            </a-col>
          </a-row>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message, Modal, Badge } from 'ant-design-vue'
import { getErrorMessage } from '@/utils/error'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  ControlOutlined,
  DollarOutlined,
  CarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue'

import {
  cancelAdminOrder,
  getAdminOrderCounterPaymentQr,
  getAdminOrderDetail,
  markAdminOrderPaid,
  markAdminOrderDeliveryFailed,
  updateAdminOrderMeta,
  updateAdminOrderStatus,
} from '@/api/admin-order.api'
import { createAdminReturnRequest } from '@/api/return-refund.api'

const router = useRouter()
const route = useRoute()
const orderId = Number(route.params.id)

const loading = ref(false)
const detail = ref(null)

const paymentStatusOptions = ['UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED']
const paymentFixStatusOptions = ['FAILED', 'PAID']
const shippingStatusOptions = ['PENDING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED_TO_SENDER']

const paymentModal = reactive({
  open: false,
  loading: false,
  paymentStatus: undefined,
})

const orderStatusModal = reactive({
  open: false,
  loading: false,
  orderStatus: undefined,
})

const shippingModal = reactive({
  open: false,
  loading: false,
  shippingStatus: undefined,
  shippingCarrier: '',
  trackingCode: '',
  deliveryFailReason: '',
})

const cancelModal = reactive({
  open: false,
  loading: false,
  reason: '',
})

const returnModal = reactive({
  open: false,
  loading: false,
  returnNote: '',
  items: [],
})

const counterQrModal = reactive({
  open: false,
  loading: false,
  checking: false,
})

const counterQrData = reactive({
  qrImageUrl: '',
  bankName: '',
  bankAccountNo: '',
  accountName: '',
  transferContent: '',
})

const quickShipForm = reactive({
  visible: false,
  loading: false,
  shippingCarrier: '',
  trackingCode: '',
})

const itemColumns = [
  { title: 'Sản phẩm', key: 'product' },
  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'center' },
  { title: 'Đơn giá', key: 'unitPrice', width: 140, align: 'right' },
  { title: 'Giảm giá', key: 'discount', width: 140, align: 'right' },
  { title: 'Thành tiền', key: 'lineTotalAmount', width: 150, align: 'right' },
]

const returnColumns = [
  { title: 'Sản phẩm', dataIndex: 'productNameSnapshot', key: 'productNameSnapshot' },
  { title: 'Tối đa', dataIndex: 'max', key: 'max', width: 80, align: 'center' },
  { title: 'SL trả', key: 'returnedQuantity', width: 120 },
  { title: 'Ghi chú', key: 'returnNote' },
]

const FILE_BASE_URL = 'http://localhost:8080'
const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/80x80?text=No+Image'

function normalizeOrderImageUrl(path) {
  if (!path) return ''

  const value = String(path).trim()
  if (!value) return ''

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:')
  ) {
    return value
  }

  return `${FILE_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

function getOrderItemImage(record) {
  return normalizeOrderImageUrl(
    record?.imageUrlSnapshot ||
    record?.imageUrl ||
    record?.variantImageUrl ||
    record?.productThumbnail
  )
}

function handleOrderItemImageError(e) {
  e.target.src = DEFAULT_PRODUCT_IMAGE
}

const isBankTransfer = computed(() => detail.value?.paymentMethod === 'BANK_TRANSFER')
const isOfflineOrder = computed(() => detail.value?.channel === 'OFFLINE')
const isOnlineOrder = computed(() => detail.value?.channel === 'ONLINE')
const isOfflineCashWaitingPayment = computed(() =>
  detail.value?.channel === 'OFFLINE'
  && detail.value?.paymentMethod === 'CASH'
  && detail.value?.paymentStatus === 'UNPAID'
  && detail.value?.orderStatus === 'NEW'
)

const FINAL_ORDER_STATUSES = ['COMPLETED', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED']

const normalizeCurrentOrderStatus = computed(() => {
  if (isOfflineOrder.value && detail.value?.paymentStatus === 'PAID') {
    return 'COMPLETED'
  }
  return detail.value?.orderStatus || null
})

const isCompletedOrder = computed(() =>
  normalizeCurrentOrderStatus.value === 'COMPLETED'
)

const isFinalOrder = computed(() => FINAL_ORDER_STATUSES.includes(normalizeCurrentOrderStatus.value))

const canShowPaymentFix = computed(() =>
  !!detail.value
  && isOnlineOrder.value
  && detail.value?.paymentMethod === 'BANK_TRANSFER'
  && detail.value?.paymentStatus === 'FAILED'
  && !['COMPLETED', 'CANCELLED', 'PARTIALLY_RETURNED', 'RETURNED'].includes(normalizeCurrentOrderStatus.value)
)

const canUpdatePayment = computed(() => canShowPaymentFix.value)

const canShowShippingUpdate = computed(() =>
  !!detail.value
  && isOnlineOrder.value
  && !isFinalOrder.value
  && ['PROCESSING', 'SHIPPING'].includes(normalizeCurrentOrderStatus.value)
  && ['READY_TO_SHIP', 'SHIPPED'].includes(detail.value?.shippingStatus)
)

const canUpdateShipping = computed(() => canShowShippingUpdate.value)

const isPaymentCompletedForBankTransfer = computed(() => {
  if (!isBankTransfer.value) return true
  return detail.value?.paymentStatus === 'PAID'
})

const canConfirmOnlineOrder = computed(() => {
  if (!detail.value) return false
  if (!isOnlineOrder.value) return false
  if (normalizeCurrentOrderStatus.value !== 'NEW') return false
  if (isBankTransfer.value && !isPaymentCompletedForBankTransfer.value) return false
  return true
})

const confirmBlockedReason = computed(() => {
  if (
    isOnlineOrder.value
    && normalizeCurrentOrderStatus.value === 'NEW'
    && isBankTransfer.value
    && detail.value?.paymentStatus !== 'PAID'
  ) {
    return 'Đơn online thanh toán chuyển khoản chưa hoàn thành nên chưa thể xác nhận đơn.'
  }
  return ''
})

const allowedNextOrderStatuses = computed(() => {
  const current = normalizeCurrentOrderStatus.value
  if (!current) return []

  if (isOnlineOrder.value) {
    switch (current) {
      case 'NEW':
        return canConfirmOnlineOrder.value ? ['PROCESSING', 'CANCELLED'] : ['CANCELLED']
      case 'PROCESSING':
        return ['SHIPPING', 'CANCELLED']
      case 'SHIPPING':
        return ['COMPLETED']
      default:
        return []
    }
  }

  if (isOfflineOrder.value) {
    switch (current) {
      case 'NEW':
        return ['PROCESSING', 'CANCELLED']
      case 'PROCESSING':
        return ['COMPLETED', 'CANCELLED']
      default:
        return []
    }
  }

  return []
})

const orderStatusOptions = computed(() => allowedNextOrderStatuses.value)

const canUpdateOrderStatus = computed(() => allowedNextOrderStatuses.value.length > 0)

const canCancelOrder = computed(() =>
  ['NEW', 'PROCESSING'].includes(normalizeCurrentOrderStatus.value)
)

const canMarkPaid = computed(() => {
  if (!detail.value) return false
  if (FINAL_ORDER_STATUSES.includes(normalizeCurrentOrderStatus.value)) return false
  if (['PAID', 'REFUNDED'].includes(detail.value?.paymentStatus)) return false

  if (isOfflineOrder.value) return true

  if (isOnlineOrder.value) {
    if (detail.value?.paymentMethod === 'BANK_TRANSFER') return false
    if (detail.value?.paymentMethod === 'COD') return false
    return true
  }

  return false
})

const canCreateCounterQr = computed(() =>
  isOfflineOrder.value
  && isBankTransfer.value
  && !FINAL_ORDER_STATUSES.includes(normalizeCurrentOrderStatus.value)
  && detail.value?.paymentStatus !== 'PAID'
)

const canMarkReadyToShip = computed(() =>
  !isCompletedOrder.value
  && isOnlineOrder.value
  && normalizeCurrentOrderStatus.value === 'PROCESSING'
  && ['PENDING', 'READY_TO_SHIP'].includes(detail.value?.shippingStatus)
)

const canMarkShipped = computed(() =>
  !isCompletedOrder.value
  && isOnlineOrder.value
  && normalizeCurrentOrderStatus.value === 'PROCESSING'
  && detail.value?.shippingStatus === 'READY_TO_SHIP'
)

const canMarkDelivered = computed(() =>
  !isCompletedOrder.value
  && isOnlineOrder.value
  && normalizeCurrentOrderStatus.value === 'SHIPPING'
  && detail.value?.shippingStatus === 'SHIPPED'
)

const canCompleteOrder = computed(() =>
  isOnlineOrder.value
  && normalizeCurrentOrderStatus.value === 'SHIPPING'
  && detail.value?.shippingStatus === 'DELIVERED'
)

const canShowReturn = computed(() => {
  if (normalizeCurrentOrderStatus.value !== 'COMPLETED') return false
  const doneAt = detail.value?.completedAt || detail.value?.deliveredAt
  if (!doneAt) return false
  return dayjs(doneAt).add(7, 'day').isAfter(dayjs())
})

const canOpenReturn = computed(() => canShowReturn.value)

const canShowConfirmProcessing = computed(() => canConfirmOnlineOrder.value)
const canShowReadyToShip = computed(() => canMarkReadyToShip.value)
const canShowHandOverShipping = computed(() => canMarkShipped.value)
const canShowDeliverySuccess = computed(() => canMarkDelivered.value)
const canShowDeliveryFailed = computed(() =>
  !!detail.value
  && isOnlineOrder.value
  && normalizeCurrentOrderStatus.value === 'SHIPPING'
  && detail.value?.shippingStatus === 'SHIPPED'
)

const hasBusinessActions = computed(() =>
  canShowPaymentFix.value
  || canShowShippingUpdate.value
  || canShowReturn.value
)

const pickNumber = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return 0
}

const receivedAmount = computed(() => pickNumber(
  detail.value?.receivedAmount,
  detail.value?.actualReceivedAmount,
  detail.value?.paidAmount,
  detail.value?.actualPaidAmount,
  detail.value?.paymentActualAmount,
  detail.value?.latestPayment?.actualAmount,
  detail.value?.paymentTransaction?.actualAmount,
  detail.value?.transactionSummary?.actualAmount
))

const payableAmount = computed(() => pickNumber(detail.value?.finalAmount, detail.value?.totalAmount))
const paymentDifference = computed(() => payableAmount.value - receivedAmount.value)

const lastTransferReceivedAt = computed(() =>
  detail.value?.lastTransferReceivedAt
  || detail.value?.paymentReceivedAt
  || detail.value?.latestPayment?.confirmedAt
  || detail.value?.paymentTransaction?.confirmedAt
  || detail.value?.transactionSummary?.confirmedAt
  || null
)

const normalizeTransferEvents = () => {
  const rawEvents = []
  const sourceArrays = [
    detail.value?.paymentHistory,
    detail.value?.paymentTransactions,
    detail.value?.paymentEvents,
    detail.value?.bankTransferEvents,
    detail.value?.transactionEvents,
  ].filter(Array.isArray)

  sourceArrays.forEach((arr) => rawEvents.push(...arr))

  if (rawEvents.length === 0 && isBankTransfer.value && receivedAmount.value > 0) {
    rawEvents.push({
      time: lastTransferReceivedAt.value,
      actualAmount: receivedAmount.value,
      runningAmount: receivedAmount.value,
    })
  }

  return rawEvents
    .map((item) => {
      const amount = pickNumber(item?.transferAmount, item?.amount, item?.actualAmount, item?.receivedAmount)
      const runningAmount = pickNumber(
        item?.runningAmount,
        item?.actualAmount,
        item?.totalReceivedAmount,
        item?.receivedAmount,
        amount
      )
      const time =
        item?.confirmedAt
        || item?.receivedAt
        || item?.transactionDate
        || item?.createdAt
        || item?.time
        || lastTransferReceivedAt.value

      const diff = payableAmount.value - runningAmount
      let label = `Nhận chuyển khoản ${formatMoney(amount)}`
      let kind = 'paid'

      if (diff > 0) {
        label += ` - còn thiếu ${formatMoney(diff)}`
        kind = 'underpaid'
      } else if (diff < 0) {
        label += ` - dư ${formatMoney(Math.abs(diff))}`
        kind = 'overpaid'
      } else {
        label += ' - đã nhận đủ'
      }

      return { time, label, kind }
    })
    .sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
}

const paymentHistoryEvents = computed(() => normalizeTransferEvents())

const suggestionTitle = computed(() => {
  if (!detail.value) return ''

  if (normalizeCurrentOrderStatus.value === 'CANCELLED' && detail.value?.shippingStatus === 'DELIVERY_FAILED') {
    return 'Đơn giao hàng không thành công và đã được hủy. Kiểm tra tồn kho và thanh toán nếu cần.'
  }
  if (normalizeCurrentOrderStatus.value === 'CANCELLED') {
    return 'Đơn hàng đã hủy. Không còn thao tác xử lý đơn.'
  }
  if (normalizeCurrentOrderStatus.value === 'COMPLETED') {
    return 'Đơn hàng đã hoàn thành. Có thể xử lý hoàn trả nếu khách yêu cầu.'
  }

  if (isOnlineOrder.value) {
    if (normalizeCurrentOrderStatus.value === 'NEW') return 'Đơn online mới tạo'
    if (normalizeCurrentOrderStatus.value === 'PROCESSING') return 'Đơn đang chuẩn bị hàng'
    if (normalizeCurrentOrderStatus.value === 'SHIPPING') return 'Đơn đang ở đơn vị vận chuyển'
  }

  if (isOfflineOrder.value) {
    if (isBankTransfer.value && detail.value?.paymentStatus !== 'PAID') return 'Đơn tại quầy chờ khách thanh toán'
    if (detail.value?.paymentStatus === 'PAID') return 'Đơn tại quầy đã nhận đủ tiền'
    return 'Đơn bán tại quầy'
  }

  return 'Gợi ý thao tác'
})

const suggestionDescription = computed(() => {
  if (!detail.value) return ''

  if (normalizeCurrentOrderStatus.value === 'CANCELLED' && detail.value?.shippingStatus === 'DELIVERY_FAILED') {
    return 'Đơn giao hàng không thành công và đã được hủy. Kiểm tra tồn kho và thanh toán nếu cần.'
  }
  if (normalizeCurrentOrderStatus.value === 'CANCELLED') {
    return 'Đơn hàng đã hủy. Không còn thao tác xử lý đơn.'
  }
  if (normalizeCurrentOrderStatus.value === 'COMPLETED') {
    return 'Đơn hàng đã hoàn thành. Có thể xử lý hoàn trả nếu khách yêu cầu.'
  }

  if (isOnlineOrder.value) {
    if (normalizeCurrentOrderStatus.value === 'NEW') {
      if (isBankTransfer.value && detail.value?.paymentStatus !== 'PAID') {
        return 'Đơn chuyển khoản online phải thanh toán hoàn tất trước khi xác nhận đơn.'
      }
      return 'Kiểm tra thông tin đơn và xác nhận để chuyển xuống kho xử lý.'
    }

    if (normalizeCurrentOrderStatus.value === 'PROCESSING') {
      if (detail.value?.shippingStatus === 'READY_TO_SHIP') {
        return 'Kiện hàng đã sẵn sàng. Trước khi xác nhận đã gửi vận chuyển, cần nhập đầy đủ đơn vị vận chuyển và mã vận đơn.'
      }
      return 'Kho đang đóng gói. Khi dán tem xong, bấm Sẵn sàng giao.'
    }

    if (normalizeCurrentOrderStatus.value === 'SHIPPING') {
      if (detail.value?.shippingStatus === 'DELIVERED') {
        return 'Đơn đã giao thành công, bạn có thể khép lại chu trình bằng nút Hoàn thành đơn.'
      }
      return 'Theo dõi vận đơn. Khi có xác nhận giao thành công, bấm Giao thành công. Nếu giao thất bại, bấm Giao hàng không thành công.'
    }
  }

  if (isOfflineOrder.value) {
    if (isBankTransfer.value && detail.value?.paymentStatus !== 'PAID') {
      return 'Cho khách quét QR và kiểm tra callback. Chỉ khi đã thanh toán mới nên hoàn thành đơn.'
    }
    if (detail.value?.paymentStatus === 'PAID') {
      return 'Đơn tại quầy đã thanh toán. Hệ thống sẽ tự xử lý hoàn thành đơn.'
    }
    return 'Xác nhận đã thanh toán khi khách đưa đủ tiền mặt.'
  }

  return ''
})

const smartSuggestionActions = computed(() => {
  if (!detail.value) return []
  if (isCompletedOrder.value) return []

  const actions = []
  const status = normalizeCurrentOrderStatus.value

  if (isOnlineOrder.value) {
    if (status === 'NEW') {
      if (canConfirmOnlineOrder.value) {
        actions.push({
          key: 'confirm-order',
          label: 'Xác nhận đơn',
          type: 'primary',
          handler: () => updateOrderStatusAction('PROCESSING'),
        })
      }

      if (canCancelOrder.value) {
        actions.push({
          key: 'cancel-new',
          label: 'Hủy đơn',
          danger: true,
          handler: openCancelModal,
        })
      }
    }

    if (status === 'PROCESSING') {
      if (detail.value?.shippingStatus === 'READY_TO_SHIP') {
        actions.push({
          key: 'ship-order',
          label: 'Đã gửi vận chuyển',
          type: 'primary',
          handler: quickShipOrder,
        })
      } else {
        actions.push({
          key: 'ready-to-ship',
          label: 'Sẵn sàng giao',
          type: 'primary',
          handler: () => quickSetShippingStatus('READY_TO_SHIP'),
        })
      }

      if (canCancelOrder.value) {
        actions.push({
          key: 'cancel-processing',
          label: 'Hủy đơn',
          danger: true,
          handler: openCancelModal,
        })
      }
    }

    if (status === 'SHIPPING') {
      if (detail.value?.shippingStatus === 'DELIVERED') {
        actions.push({
          key: 'complete-order',
          label: 'Hoàn thành đơn',
          type: 'primary',
          handler: () => updateOrderStatusAction('COMPLETED'),
        })
      } else {
        actions.push({
          key: 'delivered-order',
          label: 'Giao thành công',
          type: 'primary',
          handler: () => quickSetShippingStatus('DELIVERED'),
        })
        actions.push({
          key: 'delivery-failed',
          label: 'Giao hàng không thành công',
          danger: true,
          handler: markDeliveryFailedAction,
        })
      }
    }
  }

  if (isOfflineOrder.value) {
    if (isBankTransfer.value && detail.value?.paymentStatus !== 'PAID') {
      actions.push({
        key: 'create-counter-qr',
        label: 'Tạo QR thanh toán',
        type: 'primary',
        handler: openCounterQrModal,
      })
    }

    if (canMarkPaid.value) {
      actions.push({
        key: 'mark-paid',
        label: 'Đã thanh toán',
        type: 'primary',
        handler: () => quickSetPaymentStatus('PAID'),
      })
    }

    if (canCancelOrder.value) {
      actions.push({
        key: 'cancel-offline',
        label: 'Hủy đơn',
        danger: true,
        handler: openCancelModal,
      })
    }
  }

  return actions
})

const resetCounterQrData = () => {
  counterQrData.qrImageUrl = ''
  counterQrData.bankName = ''
  counterQrData.bankAccountNo = ''
  counterQrData.accountName = ''
  counterQrData.transferContent = ''
}

const mapCounterQrResponse = (data = {}) => {
  counterQrData.qrImageUrl =
    data.qrImageUrl || data.qr_url || data.qrCodeUrl || data.qr_code_url || detail.value?.qrImageUrl || ''

  counterQrData.bankName =
    data.bankName || data.bank_name || data.bankCode || detail.value?.bankName || '-'

  counterQrData.bankAccountNo =
    data.bankAccountNo || data.bank_account_no || data.accountNumber || detail.value?.bankAccountNo || '-'

  counterQrData.accountName =
    data.accountName || data.account_name || data.bankAccountName || detail.value?.bankAccountName || '-'

  counterQrData.transferContent =
    data.transferContent || data.transfer_content || data.paymentCode || detail.value?.paymentCode || '-'
}

const reloadCounterQr = async () => {
  counterQrModal.loading = true
  try {
    const response = await getAdminOrderCounterPaymentQr(orderId)
    mapCounterQrResponse(response.data || {})
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tạo được QR thanh toán'))
  } finally {
    counterQrModal.loading = false
  }
}

const openCounterQrModal = async () => {
  resetCounterQrData()
  counterQrModal.open = true
  await reloadCounterQr()
}

const refreshQrPaymentStatus = async () => {
  counterQrModal.checking = true
  try {
    await fetchDetail()
    if (detail.value?.paymentStatus === 'PAID') {
      message.success('Đơn đã được callback xác nhận thanh toán')
      counterQrModal.open = false
    } else if (detail.value?.paymentStatus === 'PARTIALLY_PAID') {
      message.warning('Đã nhận chuyển khoản một phần')
    } else {
      message.info('Chưa ghi nhận callback thanh toán mới')
    }
  } catch (error) {
    message.error(getErrorMessage(error, 'Không kiểm tra được trạng thái thanh toán'))
  } finally {
    counterQrModal.checking = false
  }
}

const handleQrImageError = () => {
  counterQrData.qrImageUrl = ''
  message.warning('Không tải được ảnh QR. Kiểm tra lại cấu hình SePay hoặc dữ liệu backend trả về.')
}

const openQuickShipForm = () => {
  quickShipForm.visible = true
  quickShipForm.loading = false
  quickShipForm.shippingCarrier = detail.value?.shippingCarrier || ''
  quickShipForm.trackingCode = detail.value?.trackingCode || ''
}

const closeQuickShipForm = () => {
  quickShipForm.visible = false
  quickShipForm.loading = false
  quickShipForm.shippingCarrier = ''
  quickShipForm.trackingCode = ''
}

const submitQuickShipForm = async () => {
  if (!quickShipForm.shippingCarrier?.trim()) {
    return message.warning('Vui lòng nhập đơn vị vận chuyển')
  }

  if (!quickShipForm.trackingCode?.trim()) {
    return message.warning('Vui lòng nhập mã vận đơn')
  }

  if (isCompletedOrder.value) {
    closeQuickShipForm()
    return message.warning('Đơn đã hoàn thành nên không thể cập nhật vận chuyển')
  }

  quickShipForm.loading = true
  let shippingMetaUpdated = false

  try {
    await updateAdminOrderMeta(orderId, {
      shippingStatus: 'SHIPPED',
      shippingCarrier: quickShipForm.shippingCarrier.trim(),
      trackingCode: quickShipForm.trackingCode.trim(),
    })
    shippingMetaUpdated = true

    await updateAdminOrderStatus(orderId, { status: 'SHIPPING' })

    closeQuickShipForm()
    message.success('Đã cập nhật đơn sang trạng thái đang giao hàng')
    await fetchDetail()
  } catch (err) {
    await fetchDetail()

    if (shippingMetaUpdated) {
      closeQuickShipForm()
      return message.warning(
        getErrorMessage(err, 'Đã lưu thông tin vận chuyển, nhưng chưa cập nhật được trạng thái đơn sang Đang giao hàng')
      )
    }

    message.error(getErrorMessage(err, 'Không cập nhật được trạng thái giao hàng'))
  } finally {
    quickShipForm.loading = false
  }
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const response = await getAdminOrderDetail(orderId)
    detail.value = response.data
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tải được chi tiết đơn hàng'))
  } finally {
    loading.value = false
  }
}

const openOrderStatusModal = () => {
  if (!canUpdateOrderStatus.value) {
    return message.info('Đơn hàng này không còn trạng thái tiếp theo hợp lệ để cập nhật')
  }

  orderStatusModal.open = true
  orderStatusModal.loading = false
  orderStatusModal.orderStatus = allowedNextOrderStatuses.value[0]
}

const openPaymentModal = () => {
  if (!canUpdatePayment.value) {
    return message.warning('Chỉ đơn online thanh toán chuyển khoản bị lỗi mới được cập nhật trạng thái thanh toán tại đây.')
  }

  paymentModal.open = true
  paymentModal.loading = false
  paymentModal.paymentStatus = detail.value?.paymentStatus
}

const openShippingModal = () => {
  if (!canUpdateShipping.value) {
    return message.warning('Đơn hàng đã hoàn thành hoặc đã hủy, không thể cập nhật vận chuyển.')
  }

  shippingModal.open = true
  shippingModal.loading = false
  shippingModal.shippingStatus = detail.value?.shippingStatus
  shippingModal.shippingCarrier = detail.value?.shippingCarrier || ''
  shippingModal.trackingCode = detail.value?.trackingCode || ''
  shippingModal.deliveryFailReason = detail.value?.deliveryFailReason || ''
}

const displayValidName = (val) => {
  if (!val || String(val).trim().toLowerCase() === 'null' || String(val).trim().toLowerCase() === 'undefined') {
    return ''
  }
  return String(val).trim()
}

const markDeliveryFailedAction = () => {
  if (!canShowDeliveryFailed.value) {
    return message.warning('Không thể cập nhật giao hàng không thành công cho đơn ở trạng thái hiện tại.')
  }

  const reason = window.prompt('Nhập lý do giao hàng không thành công:', detail.value?.deliveryFailReason || 'Khách không nhận hàng')
  if (reason === null) return
  const trimmed = String(reason || '').trim()
  if (!trimmed) {
    return message.warning('Vui lòng nhập lý do giao hàng không thành công')
  }

  Modal.confirm({
    title: 'Xác nhận giao hàng không thành công',
    content: 'Đơn sẽ được hủy và hoàn/release tồn kho. Tiếp tục?',
    okText: 'Xác nhận',
    cancelText: 'Hủy',
    okButtonProps: { danger: true },
    async onOk() {
      try {
        await markAdminOrderDeliveryFailed(orderId, { reason: trimmed })
        message.success('Đã cập nhật đơn hàng giao không thành công và hủy đơn.')
        await fetchDetail()
      } catch (err) {
        message.error(getErrorMessage(err, 'Không thể cập nhật giao hàng không thành công cho đơn ở trạng thái hiện tại.'))
      }
    },
  })
}

const quickSetShippingStatus = (status) => {
  if (isCompletedOrder.value) {
    return message.warning('Đơn hàng đã hoàn thành hoặc đã hủy, không thể cập nhật vận chuyển.')
  }

  Modal.confirm({
    title: 'Xác nhận cập nhật vận chuyển',
    content: `Bạn có chắc muốn chuyển trạng thái vận chuyển thành "${shippingStatusText(status)}"?`,
    okText: 'Xác nhận',
    cancelText: 'Hủy',
    async onOk() {
      try {
        await updateAdminOrderMeta(orderId, { shippingStatus: status })
        message.success('Đã cập nhật trạng thái vận chuyển thành công')
        await fetchDetail()
      } catch (err) {
        message.error(getErrorMessage(err, 'Lỗi cập nhật trạng thái vận chuyển'))
      }
    },
  })
}

const quickShipOrder = () => {
  openQuickShipForm()
}

const quickSetPaymentStatus = (status) => {
  if (isCompletedOrder.value) {
    return message.warning('Chỉ đơn online thanh toán chuyển khoản bị lỗi mới được cập nhật trạng thái thanh toán tại đây.')
  }

  Modal.confirm({
    title: 'Xác nhận cập nhật thanh toán',
    content: `Bạn có chắc muốn chuyển trạng thái thanh toán thành "${paymentStatusText(status)}"?`,
    okText: 'Xác nhận',
    cancelText: 'Hủy',
    async onOk() {
      try {
        if (isOfflineCashWaitingPayment.value && status === 'PAID') {
          await markAdminOrderPaid(orderId)
        } else {
          const payload = { paymentStatus: status }

          if (isOfflineOrder.value && status === 'PAID') {
            payload.orderStatus = 'COMPLETED'
          }

          await updateAdminOrderMeta(orderId, payload)
        }
        message.success('Đã cập nhật trạng thái thanh toán')
        await fetchDetail()
      } catch (err) {
        message.error(getErrorMessage(err, 'Lỗi cập nhật trạng thái thanh toán'))
      }
    },
  })
}

const submitOrderStatusModal = async () => {
  if (!orderStatusModal.orderStatus) {
    return message.warning('Vui lòng chọn trạng thái đơn hàng')
  }

  if (!allowedNextOrderStatuses.value.includes(orderStatusModal.orderStatus)) {
    return message.error('Trạng thái đích không hợp lệ theo luồng xử lý hiện tại')
  }

  if (
    isOnlineOrder.value
    && normalizeCurrentOrderStatus.value === 'NEW'
    && orderStatusModal.orderStatus === 'PROCESSING'
    && isBankTransfer.value
    && detail.value?.paymentStatus !== 'PAID'
  ) {
    return message.warning('Đơn online thanh toán chuyển khoản chỉ được xác nhận khi đã thanh toán hoàn tất')
  }

  if (
    isOfflineOrder.value
    && orderStatusModal.orderStatus === 'COMPLETED'
    && detail.value?.paymentStatus !== 'PAID'
  ) {
    return message.warning('Đơn tại quầy chỉ nên hoàn thành khi đã thanh toán')
  }

  if (
    isOnlineOrder.value
    && orderStatusModal.orderStatus === 'SHIPPING'
    && !['READY_TO_SHIP', 'SHIPPED'].includes(detail.value?.shippingStatus)
  ) {
    return message.warning('Đơn online chỉ được chuyển sang đang giao khi đã sẵn sàng giao')
  }

  if (
    isOnlineOrder.value
    && orderStatusModal.orderStatus === 'COMPLETED'
    && detail.value?.shippingStatus !== 'DELIVERED'
  ) {
    return message.warning('Đơn online chỉ được hoàn thành khi đã giao thành công')
  }

  orderStatusModal.loading = true
  try {
    await updateAdminOrderStatus(orderId, { status: orderStatusModal.orderStatus })
    message.success('Đã cập nhật trạng thái đơn hàng')
    orderStatusModal.open = false
    await fetchDetail()
  } catch (error) {
    message.error(getErrorMessage(error, 'Không cập nhật được trạng thái đơn hàng'))
  } finally {
    orderStatusModal.loading = false
  }
}

const submitPaymentModal = async () => {
  if (!canUpdatePayment.value) {
    paymentModal.open = false
    return message.warning('Chỉ đơn online thanh toán chuyển khoản bị lỗi mới được cập nhật trạng thái thanh toán tại đây.')
  }
  if (!paymentFixStatusOptions.includes(paymentModal.paymentStatus)) {
    return message.warning('Chỉ được giữ trạng thái lỗi hoặc xác nhận đã thanh toán đủ.')
  }

  paymentModal.loading = true
  try {
    const payload = { paymentStatus: paymentModal.paymentStatus }

    await updateAdminOrderMeta(orderId, payload)
    message.success('Đã cập nhật trạng thái thanh toán')
    paymentModal.open = false
    await fetchDetail()
  } catch (error) {
    message.error(getErrorMessage(error, 'Lỗi cập nhật trạng thái thanh toán'))
  } finally {
    paymentModal.loading = false
  }
}

const submitShippingModal = async () => {
  if (isCompletedOrder.value) {
    shippingModal.open = false
    return message.warning('Đơn hàng đã hoàn thành hoặc đã hủy, không thể cập nhật vận chuyển.')
  }

  shippingModal.loading = true
  try {
    await updateAdminOrderMeta(orderId, {
      shippingStatus: shippingModal.shippingStatus,
      shippingCarrier: shippingModal.shippingCarrier,
      trackingCode: shippingModal.trackingCode,
      deliveryFailReason: shippingModal.deliveryFailReason,
    })
    shippingModal.open = false
    message.success('Đã cập nhật thông tin vận chuyển')
    await fetchDetail()
  } catch (error) {
    message.error(getErrorMessage(error, 'Không cập nhật được vận chuyển'))
  } finally {
    shippingModal.loading = false
  }
}

const updateOrderStatusAction = (status) => {
  if (!allowedNextOrderStatuses.value.includes(status)) {
    return message.error('Không thể chuyển sang trạng thái này theo luồng hiện tại')
  }

  if (
    isOnlineOrder.value
    && status === 'COMPLETED'
    && detail.value?.shippingStatus !== 'DELIVERED'
  ) {
    return message.warning('Đơn online chỉ được hoàn thành khi đã giao thành công')
  }

  Modal.confirm({
    title: 'Xác nhận cập nhật trạng thái đơn',
    content: `Đổi trạng thái đơn sang "${orderStatusText(status)}"?`,
    okText: 'Xác nhận',
    cancelText: 'Hủy',
    async onOk() {
      try {
        await updateAdminOrderStatus(orderId, { status })
        message.success('Đã cập nhật trạng thái đơn')
        await fetchDetail()
      } catch (error) {
        message.error(getErrorMessage(error, 'Không cập nhật được trạng thái đơn'))
      }
    },
  })
}

const openCancelModal = () => {
  if (!canCancelOrder.value) {
    return message.warning('Đơn hàng hiện tại không thể hủy theo luồng xử lý')
  }

  cancelModal.open = true
  cancelModal.loading = false
  cancelModal.reason = ''
}

const submitCancelModal = async () => {
  if (!cancelModal.reason?.trim()) {
    return message.warning('Cần nhập lý do hủy đơn')
  }

  cancelModal.loading = true
  try {
    await cancelAdminOrder(orderId, { reason: cancelModal.reason })
    cancelModal.open = false
    message.success('Đã hủy đơn hàng')
    await fetchDetail()
  } catch (error) {
    message.error(getErrorMessage(error, 'Không hủy được đơn hàng'))
  } finally {
    cancelModal.loading = false
  }
}

const openReturnModal = () => {
  returnModal.open = true
  returnModal.loading = false
  returnModal.returnNote = detail.value?.returnNote || ''
  returnModal.items = (detail.value?.items || []).map((item) => ({
    orderItemId: item.id,
    productNameSnapshot: item.productNameSnapshot,
    max: Math.max(0, Number(item.quantity || 0) - Number(item.returnedQuantity || 0)),
    returnedQuantity: 0,
    returnNote: item.returnNote || '',
  }))
}

const submitReturnModal = async () => {
  const items = returnModal.items
    .filter((item) => Number(item.returnedQuantity || 0) > 0)
    .map((item) => ({
      orderItemId: item.orderItemId,
      quantity: Number(item.returnedQuantity || 0),
      note: item.returnNote,
    }))

  if (items.length === 0) {
    message.warning('Vui lòng nhập số lượng sản phẩm cần trả.')
    return
  }

  returnModal.loading = true
  try {
    const response = await createAdminReturnRequest({
      orderId,
      reason: returnModal.returnNote,
      adminNote: returnModal.returnNote,
      items,
    })
    returnModal.open = false
    message.success('Đã tạo đơn hoàn trả. Chuyển sang trang xử lý đơn hoàn trả.')
    await fetchDetail()
    const returnId = response?.data?.id
    if (returnId) router.push(`/orders/returns/${returnId}`)
  } catch (error) {
    message.error(getErrorMessage(error, 'Không tạo được yêu cầu trả hàng hoàn tiền'))
  } finally {
    returnModal.loading = false
  }
}

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-')

const formatMoney = (value) => {
  if (value == null) return '-'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

const channelText = (value) => ({
  ONLINE: 'Online',
  OFFLINE: 'Tại cửa hàng',
}[value] || value || '-')

const orderStatusText = (value) => {
  if (isOfflineOrder.value && detail.value?.paymentStatus === 'PAID') {
    if (value === 'COMPLETED' || value === detail.value?.orderStatus) return 'Hoàn thành'
  }

  return ({
    NEW: 'Chờ xác nhận',
    PROCESSING: isOnlineOrder.value && detail.value?.shippingStatus === 'READY_TO_SHIP'
      ? 'Đang chuẩn bị hàng'
      : 'Đã xác nhận',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    PARTIALLY_RETURNED: 'Đã trả một phần',
    RETURNED: 'Đã trả toàn bộ',
    CANCELLED: 'Đã hủy',
  }[value] || value || '-')
}

const paymentStatusText = (value) => ({
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Chờ xác nhận',
  PARTIALLY_PAID: 'Thanh toán 1 phần',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán lỗi',
  PARTIALLY_REFUNDED: 'Hoàn 1 phần',
  REFUNDED: 'Đã hoàn tiền',
}[value] || value || '-')

const shippingStatusText = (value) => ({
  PENDING: 'Chưa xử lý',
  READY_TO_SHIP: 'Sẵn sàng giao',
  SHIPPED: 'Đã gửi vận chuyển',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao thất bại',
  RETURNED_TO_SENDER: 'Hoàn về kho',
}[value] || value || '-')

const returnStatusText = (value) => ({
  NONE: 'Chưa trả',
  PARTIALLY_RETURNED: 'Trả một phần',
  COMPLETED: 'Hoàn tất xử lý trả',
  RETURNED: 'Đã trả hàng',
}[value] || value || '-')

const paymentMethodText = (value) => ({
  COD: 'Thanh toán khi nhận hàng (COD)',
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
}[value] || value || '-')

const orderStatusColor = (value) => {
  if (isOfflineOrder.value && detail.value?.paymentStatus === 'PAID') return 'green'
  return ({
    NEW: 'blue',
    PROCESSING: 'gold',
    SHIPPING: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
  }[value] || 'default')
}

const paymentStatusColor = (value) => ({
  UNPAID: 'default',
  PENDING: 'processing',
  PARTIALLY_PAID: 'gold',
  PAID: 'success',
  FAILED: 'error',
  PARTIALLY_REFUNDED: 'warning',
  REFUNDED: 'error',
}[value] || 'default')

const shippingStatusColor = (value) => ({
  PENDING: 'default',
  READY_TO_SHIP: 'cyan',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  DELIVERY_FAILED: 'red',
  RETURNED_TO_SENDER: 'volcano',
}[value] || 'default')

onMounted(fetchDetail)
</script>

<style scoped>
.page-wrapper {
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  padding: 24px;
}

.order-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

.custom-page-header {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.header-title-wrap {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
}

.header-subtitle {
  color: #8c8c8c;
  font-size: 14px;
}

.ml-2 { margin-left: 8px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.h-100 { height: 100%; }
.fw-600 { font-weight: 600; }
.italic { font-style: italic; }

.text-danger { color: #cf1322; }
.text-warning { color: #d46b08; }
.text-success { color: #389e0d; }
.text-primary { color: #1890ff; }
.text-muted { color: #8c8c8c; }

.btn-success {
  background-color: #52c41a;
  border-color: #52c41a;
  color: #fff;
}
.btn-success:hover {
  background-color: #73d13d;
  border-color: #73d13d;
  color: #fff;
}

.action-btn {
  border-radius: 6px;
  font-weight: 500;
}

.smart-action-btn {
  height: 42px;
  font-weight: 600;
  border-radius: 10px;
}

.pro-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.bg-highlight {
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
}

.suggestion-card {
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
  border: 1px solid #dbeafe;
}

.quick-ship-card {
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.suggestion-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.suggestion-head strong {
  display: block;
  font-size: 15px;
  color: #111827;
  margin-bottom: 6px;
}

.suggestion-head p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-descriptions-item-label) {
  width: 160px;
  background-color: #fafafa !important;
  color: #595959;
  font-weight: 500;
}

:deep(.ant-descriptions-item-content) {
  color: #262626;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}

.info-label {
  color: #8c8c8c;
  width: 110px;
  flex-shrink: 0;
}

.info-value {
  color: #262626;
  flex: 1;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
  color: #595959;
}

.product-cell {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.img-wrap {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  font-size: 24px;
  color: #d9d9d9;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
  line-height: 1.4;
}

.product-meta {
  font-size: 12px;
  color: #8c8c8c;
}

.money-strong {
  font-weight: 600;
  color: #262626;
}

.summary-list {
  display: flex;
  flex-direction: column;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: #595959;
}

.total-row {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  align-items: center;
}

.final-amount {
  font-size: 20px;
  color: #cf1322;
}

.note-box {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border-left: 3px solid #d9d9d9;
}

.note-item p {
  margin: 4px 0 0 0;
  white-space: pre-wrap;
}

.custom-timeline {
  margin-top: 8px;
}

.custom-timeline :deep(.ant-timeline-item-content) {
  margin-bottom: 20px;
}

.bank-transfer-box {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}

.transfer-hint {
  margin-top: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.counter-qr-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.qr-box {
  width: 280px;
  height: 280px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  color: #8c8c8c;
  font-size: 14px;
}

.fw-700 {
  font-weight: 700;
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 12px;
  }

  .action-buttons {
    margin-top: 16px;
  }

  .counter-qr-layout {
    grid-template-columns: 1fr;
  }

  .qr-box {
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
  }
}
</style>
