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
    var province: String
    var district: String
    var ward: String
    var detail: String
    
    func toModel(customerId: UUID) -> Address {
        return Address(
            id: self.id,
            customerId: customerId,
            province: self.province,
            district: self.district,
            ward: self.ward,
            detail: self.detail
        )
    }
}
