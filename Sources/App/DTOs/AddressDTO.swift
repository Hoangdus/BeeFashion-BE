//
//  AddressDTO.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 19/02/2025.
//

import Fluent
import Vapor

struct AddressDTO: Content, @unchecked Sendable {
    var id: UUID?
	var name: String
	var phoneNumber: String
    var province: String
    var district: String
    var ward: String
    var detail: String
	var createdAt: Date?
	
    func toModel(customerID: UUID) -> Address {
        return Address(
            id: self.id,
			customerID: customerID,
			name: self.name,
			phoneNumber: self.phoneNumber,
            province: self.province,
            district: self.district,
            ward: self.ward,
            detail: self.detail
        )
    }
}
