//
//  LogDTO.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 29/04/2025.
//

import Fluent
import Vapor

struct LogDTO: Content, @unchecked Sendable {
    var id: UUID?
    var name: String
    var content: String
    var createdAt: Date?
    
    func toModel() -> Log {
        return Log(
            id: self.id,
            name: self.name,
            content: self.content,
            createdAt: self.createdAt
        )
    }
}
