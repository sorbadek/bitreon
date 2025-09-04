;; Bitreon Core Contract
;; Manages creator subscriptions and NFT badges (SIP-009) on Stacks.

;; ========== CONSTANTS & ERROR CODES ==========
(define-constant ERR_NOT_OWNER u100)
(define-constant ERR_REENTRANCY u101)
(define-constant ERR_NOT_FOUND u102)
(define-constant ERR_ALREADY_EXISTS u103)
(define-constant ERR_INSUFFICIENT_PAYMENT u104)
(define-constant ERR_SUBSCRIPTION_EXPIRED u105)
(define-constant ERR_UNAUTHORIZED u106)
(define-constant ERR_INVALID_INPUT u107)
(define-constant ERR_PAUSED u108)
(define-constant ERR_INVALID_CREATOR u109)
(define-constant ERR_INVALID_SUBSCRIPTION u110)
(define-constant ERR_TRANSFER_FAILED u111)
(define-constant ERR_MINT_FAILED u112)
(define-constant ERR_NFT_NOT_FOUND u113)

(define-constant MIN_SUBSCRIPTION_PRICE u1000) ;; 0.001 STX
(define-constant SUBSCRIPTION_DURATION u10080) ;; ~7 days

;; ========== REENTRANCY PROTECTION ==========
(define-map reentrancy-guard { caller: principal } bool)

;; ========== BLOCK HEIGHT ==========
(define-data-var current-block-height uint u0)

(define-public (update-block-height (new-height uint))
  (begin
    (var-set current-block-height new-height)
    (ok true)
  )
)

(define-public (non-reentrant)
  (let ((caller tx-sender))
    (let ((is-locked (default-to false (map-get? reentrancy-guard { caller: caller }))))
      (asserts! (not is-locked) (err ERR_REENTRANCY))
      (map-set reentrancy-guard { caller: caller } true)
      (ok true)
    )
  )
)

;; ========== STATE VARS ==========
(define-data-var contract-owner principal tx-sender)
(define-data-var next-creator-id uint u1)
(define-data-var next-subscription-id uint u1)
(define-data-var locked bool false)
(define-data-var paused bool false)
(define-data-var pending-owner (optional principal) none)

;; ========== DATA MODELS ==========
(define-map creators { creator-id: uint } {
    owner: principal,
    bns-name: (string-ascii 48),
    display-name: (string-utf8 100),
    bio: (string-utf8 1000),
    category: (string-utf8 50),
    subscription-price: uint,
    benefits: (string-utf8 2000),
    active: bool,
    created-at: uint,
    updated-at: uint,
    metadata: (optional (string-utf8 1024))
})

(define-map subscriptions { subscription-id: uint } {
    subscriber: principal,
    creator-id: uint,
    amount-paid: uint,
    expires-at: uint,
    active: bool,
    created-at: uint,
    last-renewed: uint,
    auto-renew: bool,
    metadata: (optional (string-utf8 1024))
})

(define-non-fungible-token bitreon-badge uint)

(define-map nft-badges { token-id: uint } {
    owner: principal,
    creator-id: uint,
    subscription-id: uint,
    minted-at: uint,
    metadata: (optional (string-utf8 1024))
})

(define-map creator-by-owner { owner: principal } { creator-id: uint })
(define-map creator-by-bns { bns-name: (string-ascii 48) } { creator-id: uint })
(define-map subscriber-to-creator { subscriber: principal, creator-id: uint } { subscription-id: uint })

;; ========== EVENTS (stored as data-vars so clarinet/clarity versions that don't support define-event compile) ==========
(define-data-var creator-registered-event { creator-id: uint, owner: principal, bns-name: (string-ascii 48) } { creator-id: u0, owner: 'ST000000000000000000002AMW42H, bns-name: "" })
(define-data-var creator-updated-event { creator-id: uint, by: principal } { creator-id: u0, by: 'ST000000000000000000002AMW42H })
(define-data-var creator-deactivated-event { creator-id: uint, by: principal } { creator-id: u0, by: 'ST000000000000000000002AMW42H })
(define-data-var subscription-created-event { subscription-id: uint, subscriber: principal, creator-id: uint, amount: uint, expires-at: uint } { subscription-id: u0, subscriber: 'ST000000000000000000002AMW42H, creator-id: u0, amount: u0, expires-at: u0 })
(define-data-var subscription-cancelled-event { subscription-id: uint, by: principal } { subscription-id: u0, by: 'ST000000000000000000002AMW42H })
(define-data-var nft-minted-event { token-id: uint, owner: principal, creator-id: uint } { token-id: u0, owner: 'ST000000000000000000002AMW42H, creator-id: u0 })
(define-data-var nft-transferred-event { token-id: uint, from: principal, to: principal } { token-id: u0, from: 'ST000000000000000000002AMW42H, to: 'ST000000000000000000002AMW42H })
(define-data-var nft-burned-event { token-id: uint, by: principal } { token-id: u0, by: 'ST000000000000000000002AMW42H })
(define-data-var contract-paused-event { paused: bool, by: principal } { paused: false, by: 'ST000000000000000000002AMW42H })
(define-data-var contract-ownership-transferred-event { old-owner: principal, new-owner: principal } { old-owner: 'ST000000000000000000002AMW42H, new-owner: 'ST000000000000000000002AMW42H })
(define-data-var emergency-withdraw-event { amount: uint, to: principal, by: principal } { amount: u0, to: 'ST000000000000000000002AMW42H, by: 'ST000000000000000000002AMW42H })

;; ========== HELPERS ==========
(define-private (is-owner? (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-private (validate-creator-inputs
    (bns-name (string-ascii 48))
    (display-name (string-utf8 100))
    (bio (string-utf8 1000))
    (category (string-utf8 50))
    (subscription-price uint)
    (benefits (string-utf8 2000))
  )
  (if (or
        (var-get paused)
        (<= (len bns-name) u0)
        (<= (len display-name) u0)
        (<= (len bio) u0)
        (<= (len category) u0)
        (<= (len benefits) u0)
        (< subscription-price MIN_SUBSCRIPTION_PRICE)
      )
    (err ERR_INVALID_INPUT)
    (ok true)
  )
)

(define-private (get-creator-by-id (creator-id uint))
  (match (map-get? creators { creator-id: creator-id })
    creator (ok creator)
    (err ERR_INVALID_CREATOR)
  )
)

(define-private (get-active-subscription (subscriber principal) (creator-id uint))
  (match (map-get? subscriber-to-creator { subscriber: subscriber, creator-id: creator-id })
    lookup-val
      (match (map-get? subscriptions { subscription-id: (get subscription-id lookup-val) })
        subscription-val
          (if (and (get active subscription-val)
                   (> (get expires-at subscription-val) burn-block-height))
            (ok {
              subscription-id: (get subscription-id lookup-val),
              subscription: subscription-val
            })
            (err ERR_SUBSCRIPTION_EXPIRED))
        (err ERR_NOT_FOUND))
    (err ERR_NOT_FOUND)
  )
)

;; ========== ADMIN FUNCTIONS ==========
(define-public (set-paused (paused-val bool))
  (begin
    (asserts! (is-owner? tx-sender) (err ERR_UNAUTHORIZED))
    (var-set paused paused-val)
    (var-set contract-paused-event { paused: paused-val, by: tx-sender })
    (ok true)
  )
)

(define-public (initiate-ownership-transfer (new-owner principal))
  (begin
    (asserts! (is-owner? tx-sender) (err ERR_UNAUTHORIZED))
    (var-set pending-owner (some new-owner))
    (ok true)
  )
)

(define-public (claim-ownership)
  (match (var-get pending-owner)
    new-owner
      (begin
        (asserts! (is-eq tx-sender new-owner) (err ERR_UNAUTHORIZED))
        (var-set contract-ownership-transferred-event { old-owner: (var-get contract-owner), new-owner: new-owner })
        (var-set contract-owner new-owner)
        (var-set pending-owner none)
        (ok true)
      )
    (err ERR_NOT_FOUND)
  )
)

(define-public (emergency-withdraw (amount uint) (to principal))
  (begin
    (asserts! (is-owner? tx-sender) (err ERR_UNAUTHORIZED))
    ;; transfer from contract to `to`. using as-contract wrapper so the contract's STX are used
    (match (as-contract (stx-transfer? amount contract-caller to))
  ok-result
    (begin
      (var-set emergency-withdraw-event { amount: amount, to: to, by: tx-sender })
      (ok true))
  err-code (err ERR_TRANSFER_FAILED))

  )
)

;; ========== CREATOR FUNCTIONS ==========
(define-public (register-creator
    (bns-name (string-ascii 48))
    (display-name (string-utf8 100))
    (bio (string-utf8 1000))
    (category (string-utf8 50))
    (subscription-price uint)
    (benefits (string-utf8 2000))
    (metadata (optional (string-utf8 1024)))
  )
  (let (
      (caller tx-sender)
      (creator-id (var-get next-creator-id))
    )
    (unwrap! (validate-creator-inputs bns-name display-name bio category subscription-price benefits) (err ERR_INVALID_INPUT))
    (asserts! (is-none (map-get? creator-by-owner { owner: caller })) (err ERR_ALREADY_EXISTS))
    (asserts! (is-none (map-get? creator-by-bns { bns-name: bns-name })) (err ERR_ALREADY_EXISTS))
    
    (map-set creators { creator-id: creator-id }
      {
        owner: caller,
        bns-name: bns-name,
        display-name: display-name,
        bio: bio,
        category: category,
        subscription-price: subscription-price,
        benefits: benefits,
        active: true,
        created-at: burn-block-height,
        updated-at: burn-block-height,
        metadata: metadata
      })
    (map-set creator-by-owner { owner: caller } { creator-id: creator-id })
    (map-set creator-by-bns { bns-name: bns-name } { creator-id: creator-id })
    (var-set next-creator-id (+ creator-id u1))
    (var-set creator-registered-event { creator-id: creator-id, owner: caller, bns-name: bns-name })
    (ok creator-id)
  )
)

(define-public (update-creator
    (creator-id uint)
    (display-name (optional (string-utf8 100)))
    (bio (optional (string-utf8 1000)))
    (category (optional (string-utf8 50)))
    (subscription-price (optional uint))
    (benefits (optional (string-utf8 2000)))
    (metadata (optional (string-utf8 1024)))
  )
  (let (
      (caller tx-sender)
      (creator (unwrap! (get-creator-by-id creator-id) (err ERR_NOT_FOUND)))
    )
    (asserts! (is-eq caller (get owner creator)) (err ERR_UNAUTHORIZED))
    
    (let (
        (new-display-name (if (is-none display-name) (get display-name creator) (unwrap-panic display-name)))
        (new-bio (if (is-none bio) (get bio creator) (unwrap-panic bio)))
        (new-category (if (is-none category) (get category creator) (unwrap-panic category)))
        (new-price (if (is-none subscription-price) (get subscription-price creator) (unwrap-panic subscription-price)))
        (new-benefits (if (is-none benefits) (get benefits creator) (unwrap-panic benefits)))
        (new-metadata (if (is-none metadata) (get metadata creator) metadata))
      )
      (match (validate-creator-inputs (get bns-name creator) new-display-name new-bio new-category new-price new-benefits)
  ok-val
    (begin
      (map-set creators { creator-id: creator-id }
        (merge creator {
          display-name: new-display-name,
          bio: new-bio,
          category: new-category,
          subscription-price: new-price,
          benefits: new-benefits,
          updated-at: burn-block-height,
          metadata: new-metadata
        })
      )
      (var-set creator-updated-event { creator-id: creator-id, by: caller })
      (ok true)
    )
  err-val (err err-val)
)

    )
  ))

(define-public (deactivate-creator (creator-id uint))
  (let (
      (caller tx-sender)
      (creator (unwrap! (get-creator-by-id creator-id) (err ERR_NOT_FOUND)))
    )
    (asserts! (or (is-eq caller (get owner creator)) (is-owner? caller)) (err ERR_UNAUTHORIZED))
    (map-set creators { creator-id: creator-id }
      (merge creator {
        active: false,
        updated-at: burn-block-height
      })
    )
    (var-set creator-deactivated-event { creator-id: creator-id, by: caller })
    (ok true)
  )
)

;; ========== SUBSCRIPTION FUNCTIONS ==========
(define-public (subscribe
    (creator-id uint)
    (duration uint)
    (auto-renew bool)
    (metadata (optional (string-utf8 1024))))
  (let (
      (caller tx-sender)
      (creator (unwrap! (get-creator-by-id creator-id) (err ERR_NOT_FOUND)))
      (subscription-id (var-get next-subscription-id))
      (expires-at (+ burn-block-height duration))
      (price (get subscription-price creator))
    )
    (asserts! (get active creator) (err ERR_INVALID_CREATOR))
    
    (match (get-active-subscription caller creator-id)
      existing (err ERR_ALREADY_EXISTS)
      err-get
        (match (stx-transfer? price caller (get owner creator))
  transfer-ok
    (match (nft-mint? bitreon-badge subscription-id caller)
      mint-ok
        (begin
          ;; Create subscription
          (map-set subscriptions { subscription-id: subscription-id }
            {
              subscriber: caller,
              creator-id: creator-id,
              amount-paid: price,
              expires-at: expires-at,
              active: true,
              created-at: burn-block-height,
              last-renewed: burn-block-height,
              auto-renew: auto-renew,
              metadata: metadata
            }
          )

          ;; Update subscriber mapping
          (map-set subscriber-to-creator 
            { subscriber: caller, creator-id: creator-id } 
            { subscription-id: subscription-id })

          ;; Create NFT badge
          (map-set nft-badges { token-id: subscription-id }
            {
              owner: caller,
              creator-id: creator-id,
              subscription-id: subscription-id,
              minted-at: burn-block-height,
              metadata: metadata
            }
          )

          ;; Update state and emit events
          (var-set next-subscription-id (+ subscription-id u1))
          (var-set subscription-created-event { 
            subscription-id: subscription-id, 
            subscriber: caller, 
            creator-id: creator-id, 
            amount: price, 
            expires-at: expires-at 
          })
          (var-set nft-minted-event { 
            token-id: subscription-id, 
            owner: caller, 
            creator-id: creator-id 
          })
          (ok true)
        )
      mint-err (err ERR_MINT_FAILED)
    )
  transfer-err (err ERR_TRANSFER_FAILED)
)

    )
  )
)

;; ========== NFT FUNCTIONS (SIP-009) ==========
(define-read-only (get-token-uri (token-id uint))
  (match (map-get? nft-badges { token-id: token-id })
    badge (ok (get metadata badge))
    (ok none)
  )
)

;; SIP-009 NFT Trait Implementation
(define-read-only (get-owner (token-id uint))
  (match (map-get? nft-badges { token-id: token-id })
    nft (ok (some (get owner nft)))
    (ok none)
  )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (not (var-get paused)) (err ERR_PAUSED))
    (asserts! (is-eq tx-sender sender) (err ERR_UNAUTHORIZED))
    (let ((owner (unwrap! (nft-get-owner? bitreon-badge token-id) (err ERR_NFT_NOT_FOUND))))
      (asserts! (is-eq owner sender) (err ERR_UNAUTHORIZED))
      (let ((transfer-result (nft-transfer? bitreon-badge token-id sender recipient)))
        (match transfer-result
  tr-ok
    (begin
      (map-set nft-badges { token-id: token-id }
        (merge
          (unwrap! (map-get? nft-badges { token-id: token-id }) (err ERR_NOT_FOUND))
          { owner: recipient }
        )
      )
      (var-set nft-transferred-event { token-id: token-id, from: sender, to: recipient })
      (ok true)
    )
  tr-err (err ERR_TRANSFER_FAILED)
)

      )
    )
  )
)
    
(define-read-only (get-balance (owner principal))
  (if (is-eq owner tx-sender)
    (ok (var-get next-subscription-id))
    (ok u0)
  )
)

(define-read-only (get-total-supply)
  (ok (- (var-get next-subscription-id) u1))
)

;; ========== READ-ONLY FUNCTIONS ==========
(define-read-only (get-creator (creator-id uint))
  (match (map-get? creators { creator-id: creator-id })
    creator (ok (some creator))
    (ok none)
  )
)

(define-read-only (get-creator-by-bns (bns-name (string-ascii 48)))
  (match (map-get? creator-by-bns { bns-name: bns-name })
    lookup
      (match (map-get? creators { creator-id: (get creator-id lookup) })
        creator (ok (some creator))
        (ok none)
      )
    (ok none)
  )
)


(define-read-only (get-creator-by-owner (owner principal))
  (match (map-get? creator-by-owner { owner: owner })
    lookup
      (match (map-get? creators { creator-id: (get creator-id lookup) })
        creator (ok (some creator))
        (ok none)
      )
    (ok none)
  )
)


(define-read-only (get-subscription (subscription-id uint))
  (match (map-get? subscriptions { subscription-id: subscription-id })
    subscription (ok (some subscription))
    (ok none)
  )
)

(define-read-only (get-user-subscription (user principal) (creator-id uint))
  (match (get-active-subscription user creator-id)
    result (ok (some (get subscription result)))
    err-val (err err-val)
  )
)


(define-read-only (get-nft-badge (token-id uint))
  (match (map-get? nft-badges { token-id: token-id })
    badge (ok (some badge))
    (ok none)
  )
)

(define-read-only (is-subscribed (user principal) (creator-id uint))
  (match (get-active-subscription user creator-id)
    res (ok true)
    err (ok false)
  )
)

(define-read-only (get-contract-info)
  (ok {
    name: "Bitreon Core",
    version: "1.1.0",
    description: "Smart contract for managing creator subscriptions and NFT badges",
    nft-standard: "SIP-009",
    contract-owner: (var-get contract-owner),
    is-paused: (var-get paused)
  })
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (is-paused)
  (ok (var-get paused))
)
