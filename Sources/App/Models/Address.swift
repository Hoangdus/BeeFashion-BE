//
//  Address.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 19/02/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

final class Address: Model, @unchecked Sendable {
    static let schema = "addresses"
    
    @ID(key: .id)
    var id: UUID?
    
    @Parent(key: "customer_id")
    var customer: Customer
    
    @Field(key: "province")
    var province: String
    
    @Field(key: "district")
    var district: String
    
    @Field(key: "ward")
    var ward: String
    
    @Field(key: "detail")
    var detail: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() {}
    
	init(id: UUID? = nil, customerId: Customer.IDValue, province: String, district: String, ward: String, detail: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
		self.$customer.id = customerId
        self.province = province
        self.district = district
        self.ward = ward
        self.detail = detail
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    func toDTO() -> AddressDTO {
        .init(
            id: self.id, province: self.province, district: self.district, ward: self.ward, detail: self.detail
        )
    }
    
}
