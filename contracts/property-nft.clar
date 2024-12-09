;; property-nft contract

(define-non-fungible-token property uint)

(define-data-var next-property-id uint u0)

(define-map property-details
  { property-id: uint }
  {
    name: (string-ascii 100),
    location: (string-ascii 200),
    total-shares: uint,
    price-per-share: uint
  }
)

(define-map property-ownership
  { property-id: uint, owner: principal }
  { shares: uint }
)

(define-read-only (get-property-details (property-id uint))
  (map-get? property-details { property-id: property-id })
)

(define-read-only (get-owner-shares (property-id uint) (owner principal))
  (default-to u0 (get shares (map-get? property-ownership { property-id: property-id, owner: owner })))
)

(define-public (mint-property (name (string-ascii 100)) (location (string-ascii 200)) (total-shares uint) (price-per-share uint))
  (let
    (
      (property-id (var-get next-property-id))
    )
    (try! (nft-mint? property property-id tx-sender))
    (map-set property-details
      { property-id: property-id }
      {
        name: name,
        location: location,
        total-shares: total-shares,
        price-per-share: price-per-share
      }
    )
    (map-set property-ownership
      { property-id: property-id, owner: tx-sender }
      { shares: total-shares }
    )
    (var-set next-property-id (+ property-id u1))
    (ok property-id)
  )
)

(define-public (transfer-shares (property-id uint) (recipient principal) (shares uint))
  (let
    (
      (sender-shares (get-owner-shares property-id tx-sender))
      (recipient-shares (get-owner-shares property-id recipient))
    )
    (asserts! (>= sender-shares shares) (err u1)) ;; Insufficient shares
    (map-set property-ownership
      { property-id: property-id, owner: tx-sender }
      { shares: (- sender-shares shares) }
    )
    (map-set property-ownership
      { property-id: property-id, owner: recipient }
      { shares: (+ recipient-shares shares) }
    )
    (ok true)
  )
)

